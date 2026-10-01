#!/usr/bin/env python3
# ─── main.py ─────────────────────────────────────────────────────────────────
# Smart Park AI — Main Detection Module
#
# Starts two things simultaneously:
#   1. A Flask HTTP server (port 5001) that:
#      - Serves the latest annotated frame as /frame (for frontend preview)
#      - Exposes /status for health check
#   2. A background thread running the ANPR detection loop
#
# Usage:
#   python detector/main.py
#   python detector/main.py --source webcam
#   python detector/main.py --source video --path sample.mp4
#   python detector/main.py --source ip    --url http://192.168.1.100:8080/video

import sys
import os
import cv2
import time
import threading
import requests
import argparse
import logging
import io

from flask import Flask, Response, jsonify
from flask_cors import CORS
from PIL import Image

# Add parent dir to path so we can import anpr
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
try:
    from detector.anpr import process_frame, draw_annotations, save_plate_image, validate_plate
except ImportError:
    from anpr import process_frame, draw_annotations, save_plate_image, validate_plate

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('smartpark-ai')

# ── Config ────────────────────────────────────────────────────────────────────
BACKEND_URL      = 'http://localhost:5000/api'
AI_SERVER_PORT   = 5001
DEFAULT_INTERVAL = 2       # seconds between detections
DUPLICATE_WINDOW = 10      # ignore same plate within N seconds

# ── Global state (shared between detection thread and Flask server) ────────────
latest_frame_jpg   = None     # JPEG bytes of most recent annotated frame
latest_frame_lock  = threading.Lock()
recent_detections  = {}       # plate -> timestamp (duplicate prevention)
running            = True

# ── Flask app (serves preview frame) ──────────────────────────────────────────
app = Flask(__name__)
CORS(app)

@app.route('/frame')
def serve_frame():
    """Return the latest annotated JPEG frame."""
    with latest_frame_lock:
        if latest_frame_jpg is None:
            # Return a blank gray image if no frame yet
            blank = Image.new('RGB', (640, 480), color=(30, 30, 30))
            buf = io.BytesIO()
            blank.save(buf, format='JPEG')
            jpg = buf.getvalue()
        else:
            jpg = latest_frame_jpg

    return Response(jpg, mimetype='image/jpeg', headers={
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma':        'no-cache',
        'Expires':       '0',
    })

def generate_mjpeg():
    """Generator for streaming live MJPEG frames to browser."""
    while running:
        with latest_frame_lock:
            if latest_frame_jpg is not None:
                jpg = latest_frame_jpg
            else:
                blank = Image.new('RGB', (640, 480), color=(30, 30, 30))
                buf = io.BytesIO()
                blank.save(buf, format='JPEG')
                jpg = buf.getvalue()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpg + b'\r\n')
        time.sleep(0.066)

@app.route('/stream')
def video_stream():
    """MJPEG stream endpoint for frontend live preview."""
    return Response(generate_mjpeg(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/status')
def status():
    return jsonify({ 'status': 'running', 'port': AI_SERVER_PORT })


# ── Detection loop ─────────────────────────────────────────────────────────────

def fetch_settings():
    """Pull latest settings from backend."""
    try:
        r = requests.get(f'{BACKEND_URL}/settings', timeout=3)
        if r.ok:
            return r.json()
    except Exception:
        pass
    return {}


def is_duplicate(plate):
    """Return True if this plate was seen within the duplicate window."""
    last = recent_detections.get(plate)
    if last and (time.time() - last) < DUPLICATE_WINDOW:
        return True
    return False


def send_to_backend(plate_text, confidence, plate_filename):
    """POST detected plate to backend /api/detect."""
    try:
        payload = {
            'plateNumber': plate_text,
            'plateImage':  plate_filename,
            'confidence':  confidence,
        }
        r = requests.post(f'{BACKEND_URL}/detect', json=payload, timeout=5)
        return r.json()
    except Exception as e:
        logger.error(f'Backend error: {e}')
        return {}


def update_frame(frame, detections):
    """Encode annotated frame to JPEG and store globally."""
    global latest_frame_jpg
    annotated = draw_annotations(frame.copy(), detections)
    _, buf = cv2.imencode('.jpg', annotated, [cv2.IMWRITE_JPEG_QUALITY, 80])
    with latest_frame_lock:
        latest_frame_jpg = buf.tobytes()


def open_capture(args, settings):
    """Open the appropriate video capture source."""
    source = args.source or settings.get('cameraSource', 'webcam')

    if source == 'webcam':
        logger.info('Opening webcam (index 0)...')
        cap = cv2.VideoCapture(0)
    elif source == 'ip':
        url = args.url or settings.get('ipCameraUrl', 'http://192.168.1.100:8080/video')
        logger.info(f'Opening IP camera: {url}')
        cap = cv2.VideoCapture(url)
    elif source == 'video':
        path = args.path or settings.get('videoFilePath', 'sample.mp4')
        # Resolve relative to /ai directory
        if not os.path.isabs(path):
            path = os.path.join(os.path.dirname(os.path.dirname(__file__)), path)
        logger.info(f'Opening video file: {path}')
        cap = cv2.VideoCapture(path)
    else:
        logger.warning(f'Unknown source "{source}", defaulting to webcam')
        cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        logger.error('Failed to open video source!')
    return cap


def detection_loop(args):
    """Main ANPR processing loop — runs in background thread."""
    global running

    settings = fetch_settings()
    interval = settings.get('detectionInterval', DEFAULT_INTERVAL)

    cap = open_capture(args, settings)
    if not cap.isOpened():
        logger.error('Cannot open camera/video. Detection loop exiting.')
        return

    logger.info(f'Detection loop started. Interval: {interval}s')
    last_detect_time = 0
    frame_count      = 0

    while running:
        ret, frame = cap.read()
        if not ret:
            # Video file ended — loop it
            if args.source == 'video' or settings.get('cameraSource') == 'video':
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                logger.warning('Frame read failed, retrying...')
                time.sleep(1)
                continue

        frame_count += 1

        # Display latest frame even if not running detection yet
        update_frame(frame, [])

        now = time.time()
        if now - last_detect_time < interval:
            time.sleep(0.05)
            continue

        last_detect_time = now

        # ── Run ANPR ──────────────────────────────────────────────────────
        candidates = process_frame(frame)

        annotated_dets = []   # for drawing on frame

        for det in candidates:
            plate = det['plate']
            conf  = det['confidence']
            roi   = det['roi']
            bbox  = det['bbox']

            # Guard: strictly accept only plates matching required format
            if not validate_plate(plate):
                logger.warning(f'Rejected invalid plate format: {plate}')
                continue

            # Skip duplicates
            if is_duplicate(plate):
                logger.debug(f'Duplicate ignored: {plate}')
                continue

            recent_detections[plate] = time.time()
            logger.info(f'Detected: {plate}  conf={conf}%')

            # Save plate crop image
            img_file = save_plate_image(roi, plate)

            # Send to backend
            response = send_to_backend(plate, conf, img_file)
            action   = response.get('action', '')
            status   = response.get('status', '')

            logger.info(f'  → Backend: {status} | {action}')

            annotated_dets.append({
                'plate':      plate,
                'confidence': conf,
                'bbox':       bbox,
                'action':     action,
            })

        # Update global frame with annotations
        if annotated_dets:
            update_frame(frame, annotated_dets)

        # Refresh settings every 30 seconds
        if frame_count % 600 == 0:
            settings = fetch_settings()
            interval = settings.get('detectionInterval', DEFAULT_INTERVAL)

    cap.release()
    logger.info('Detection loop stopped.')


# ── Entry point ────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description='Smart Park AI — ANPR Module')
    p.add_argument('--source', choices=['webcam', 'ip', 'video'], default=None,
                   help='Video source (overrides database settings)')
    p.add_argument('--url',    default=None, help='IP camera URL')
    p.add_argument('--path',   default=None, help='Video file path')
    p.add_argument('--port',   type=int, default=AI_SERVER_PORT, help='Flask server port')
    return p.parse_args()


if __name__ == '__main__':
    args = parse_args()

    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    print("""
+------------------------------------------+
|       Smart Park AI -- ANPR Module       |
|  Frame server  -> http://localhost:5001  |
|  Backend       -> http://localhost:5000  |
+------------------------------------------+
    """)

    # Start detection in background thread
    det_thread = threading.Thread(target=detection_loop, args=(args,), daemon=True)
    det_thread.start()

    # Start Flask frame server (blocking)
    app.run(host='0.0.0.0', port=args.port, debug=False, use_reloader=False)
