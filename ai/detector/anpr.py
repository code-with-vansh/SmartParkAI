import os
import sys

# Ensure Windows DLL search includes scipy directory for Cython runtime DLLs
try:
    import site
    for _sp in site.getsitepackages():
        _scipy_dir = os.path.join(_sp, 'scipy')
        if os.path.isdir(_scipy_dir) and hasattr(os, 'add_dll_directory'):
            os.add_dll_directory(_scipy_dir)
except Exception:
    pass

import cv2
import numpy as np
import easyocr
import re
import time
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
USE_YOLO      = False   # Set True if ultralytics is installed
PLATE_DIR     = os.path.join(os.path.dirname(__file__), '..', 'detected_plates')
os.makedirs(PLATE_DIR, exist_ok=True)

# ── Load EasyOCR (runs once at import) ────────────────────────────────────────
print("[ANPR] Loading EasyOCR reader (first load downloads models)...")
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
print("[ANPR] EasyOCR ready.")

# ── Optionally load YOLO ──────────────────────────────────────────────────────
yolo_model = None
if USE_YOLO:
    try:
        from ultralytics import YOLO
        # Use a licence plate detection model; fall back to generic object model
        yolo_model = YOLO('yolov8n.pt')
        print("[ANPR] YOLO loaded.")
    except Exception as e:
        print(f"[ANPR] YOLO not available ({e}), using contour fallback.")
        USE_YOLO = False


# ─────────────────────────────────────────────────────────────────────────────
# PLATE REGION DETECTION
# ─────────────────────────────────────────────────────────────────────────────

def detect_plate_regions_contour(frame):
    """
    Contour-based plate detection (no ML required).
    Returns list of (x, y, w, h) bounding boxes of candidate plate regions.
    """
    gray    = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur    = cv2.bilateralFilter(gray, 11, 17, 17)
    edges   = cv2.Canny(blur, 30, 200)

    # Find all contours
    contours, _ = cv2.findContours(edges.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    # Sort by area descending, keep top 30
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:30]

    candidates = []
    for c in contours:
        peri   = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.018 * peri, True)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect = w / float(h)
            area   = w * h
            # Plate-like aspect ratio: ~2:1 to 5:1; minimum area
            if 1.5 < aspect < 6.0 and area > 2000:
                candidates.append((x, y, w, h))

    return candidates


def detect_plate_regions_yolo(frame):
    """YOLO-based detection — returns bounding boxes."""
    results = yolo_model(frame, verbose=False)
    boxes = []
    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            boxes.append((x1, y1, x2 - x1, y2 - y1))
    return boxes


def detect_plate_regions(frame):
    """Choose YOLO or contour detection based on config."""
    if USE_YOLO and yolo_model:
        return detect_plate_regions_yolo(frame)
    return detect_plate_regions_contour(frame)


# ─────────────────────────────────────────────────────────────────────────────
# OCR — Extract text from plate region
# ─────────────────────────────────────────────────────────────────────────────

# ── Plate Format Validation & Normalization ──────────────────────────────────
# Required format: AA11AA1111 (2 letters + 2 digits + 2 letters + 4 digits, exactly 10 chars)
PLATE_REGEX_STR = r'^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$'
PLATE_PATTERN   = re.compile(PLATE_REGEX_STR)

LETTER_POSITIONS = {0, 1, 4, 5}
DIGIT_POSITIONS  = {2, 3, 6, 7, 8, 9}

# OCR character confusions: digit read when letter expected
DIGIT_TO_LETTER = {
    '0': 'O',
    '1': 'I',
    '2': 'Z',
    '5': 'S',
    '8': 'B',
}

# OCR character confusions: letter read when digit expected
LETTER_TO_DIGIT = {
    'O': '0',
    'Q': '0',
    'D': '0',
    'I': '1',
    'L': '1',
    'Z': '2',
    'S': '5',
    'B': '8',
    'G': '6',
}


def validate_plate(text):
    """
    Strictly validate that text matches the required format AA11AA1111:
    - 2 uppercase English letters (A-Z)
    - 2 digits (0-9)
    - 2 uppercase English letters (A-Z)
    - 4 digits (0-9)
    - Exact total length = 10 characters
    Returns True if valid, False otherwise.
    """
    if not isinstance(text, str):
        return False
    return bool(PLATE_PATTERN.match(text))


# Alias for validation
is_valid_plate = validate_plate


def normalize_plate_text(text):
    """
    Normalize raw OCR text:
    - Uppercase and strip
    - Remove delimiters (spaces, hyphens, dots, special chars)
    - Strip country prefix 'IND' if present
    - Handle common OCR mistakes per position while strictly rejecting
      malformed formats (e.g. 5-digit endings like DL01A12345 or arbitrary text)
    - Verify that normalized result matches AA11AA1111
    Returns normalized 10-char plate string or None if invalid.
    """
    if not text or not isinstance(text, str):
        return None

    raw = text.upper().strip()

    # Remove standard 'IND' country prefix if attached with separator or at boundary
    if raw.startswith('IND') and len(raw) > 10:
        raw = raw[3:].strip()
    elif raw.endswith('IND') and len(raw) > 10:
        raw = raw[:-3].strip()

    cleaned = re.sub(r'[^A-Z0-9]', '', raw)

    # Handle 'IND' prefixed directly without space (e.g. INDDL01AB1234 -> 13 chars)
    if len(cleaned) == 13 and cleaned.startswith('IND'):
        cleaned = cleaned[3:]

    # Length must be exactly 10 characters
    if len(cleaned) != 10:
        return None

    # If already strictly valid, return immediately
    if validate_plate(cleaned):
        return cleaned

    # Guard: if last 5 characters are digits (e.g. DL01A12345),
    # this is a 5-digit number plate, NOT an OCR error in position 5. Reject it.
    if cleaned[5:10].isdigit():
        return None

    # Guard: if positions 2..4 are digits (e.g. DL011A1234), reject 3-digit district code.
    if cleaned[2:5].isdigit():
        return None

    # Apply position-specific OCR character correction
    chars = list(cleaned)
    for i in range(10):
        c = chars[i]
        if i in LETTER_POSITIONS:
            if c.isdigit() and c in DIGIT_TO_LETTER:
                chars[i] = DIGIT_TO_LETTER[c]
        elif i in DIGIT_POSITIONS:
            if c.isalpha() and c in LETTER_TO_DIGIT:
                chars[i] = LETTER_TO_DIGIT[c]

    candidate = "".join(chars)
    if validate_plate(candidate):
        return candidate

    return None


def clean_plate_text(text):
    """
    Public cleaning function for plate text.
    Normalizes OCR text and ensures it strictly satisfies the AA11AA1111 format.
    """
    return normalize_plate_text(text)


def ocr_region(roi):
    """
    Run EasyOCR on a candidate plate region.
    Returns (normalized_plate_text, confidence) or (None, 0).
    Only returns text if it strictly matches AA11AA1111 format.
    """
    if roi is None or roi.size == 0:
        return None, 0

    # Preprocess: enlarge for better OCR character recognition
    roi_resized = cv2.resize(roi, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # Run EasyOCR on resized ROI
    results = reader.readtext(roi_resized, detail=1, paragraph=False)

    # Fallback to thresholded image if nothing detected
    if not results:
        gray = cv2.cvtColor(roi_resized, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        results = reader.readtext(thresh, detail=1, paragraph=False)

    if not results:
        return None, 0

    # 1. Check if any individual detected text block is a valid plate
    for _, text, conf in results:
        cleaned = clean_plate_text(text)
        if cleaned:
            return cleaned, round(conf * 100, 1)

    # 2. EasyOCR often splits license plates into multiple bounding boxes
    # (e.g. ['DL 01', 'AB 1234'] or ['DL', '01', 'AB', '1234']).
    # Sort boxes in natural reading order: top-to-bottom, left-to-right.
    def box_sort_key(item):
        bbox = item[0]
        cy = sum(pt[1] for pt in bbox) / 4.0
        cx = sum(pt[0] for pt in bbox) / 4.0
        height = max(pt[1] for pt in bbox) - min(pt[1] for pt in bbox)
        row_height = max(15.0, height * 0.6)
        row = round(cy / row_height)
        return (row, cx)

    sorted_results = sorted(results, key=box_sort_key)

    # Try concatenating all text fragments
    combined_text = " ".join(r[1] for r in sorted_results)
    cleaned_combined = clean_plate_text(combined_text)
    if cleaned_combined:
        avg_conf = sum(r[2] for r in sorted_results) / len(sorted_results)
        return cleaned_combined, round(avg_conf * 100, 1)

    # Try sub-slices in case of prefix/suffix noise (e.g. 'IND', emblem, or screw marks)
    if len(sorted_results) > 1:
        for start in range(len(sorted_results)):
            for end in range(start + 1, len(sorted_results) + 1):
                slice_items = sorted_results[start:end]
                slice_text = " ".join(r[1] for r in slice_items)
                cleaned_slice = clean_plate_text(slice_text)
                if cleaned_slice:
                    avg_conf = sum(r[2] for r in slice_items) / len(slice_items)
                    return cleaned_slice, round(avg_conf * 100, 1)

    return None, 0


# ─────────────────────────────────────────────────────────────────────────────
# SAVE PLATE IMAGE
# ─────────────────────────────────────────────────────────────────────────────

def save_plate_image(roi, plate_text):
    """
    Save cropped plate image to detected_plates/ folder.
    Returns filename string.
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename  = f"{plate_text}_{timestamp}.jpg"
    filepath  = os.path.join(PLATE_DIR, filename)
    cv2.imwrite(filepath, roi)
    return filename


# ─────────────────────────────────────────────────────────────────────────────
# DRAW ANNOTATIONS ON FRAME
# ─────────────────────────────────────────────────────────────────────────────

def draw_annotations(frame, detections):
    """
    Draw bounding boxes and plate text on frame.
    detections: list of { plate, confidence, bbox: (x,y,w,h), action }
    """
    for det in detections:
        x, y, w, h  = det['bbox']
        plate        = det.get('plate', '')
        conf         = det.get('confidence', 0)
        action       = det.get('action', '')

        # Box color: green for ENTRY, red for EXIT, yellow for unknown
        color = (0, 200, 80) if action == 'ENTRY' else \
                (0, 60, 220) if action == 'EXIT'  else \
                (0, 200, 255)

        # Draw bounding box
        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)

        # Label background
        label = f"{plate}  {action}  {conf}%"
        (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(frame, (x, y - lh - 10), (x + lw + 6, y), color, -1)

        # Label text
        cv2.putText(frame, label, (x + 3, y - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

    # Timestamp overlay
    ts = datetime.now().strftime('%Y-%m-%d  %H:%M:%S')
    cv2.putText(frame, ts, (10, frame.shape[0] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)

    return frame


# ─────────────────────────────────────────────────────────────────────────────
# PROCESS SINGLE FRAME
# ─────────────────────────────────────────────────────────────────────────────

def process_frame(frame):
    """
    Full pipeline: detect regions → OCR → return list of valid plate detections.
    Returns: list of { plate, confidence, roi, bbox }
    Only detections matching the required format AA11AA1111 are returned.
    """
    results    = []
    candidates = detect_plate_regions(frame)

    for (x, y, w, h) in candidates:
        # Clamp to frame bounds
        x, y = max(0, x), max(0, y)
        roi  = frame[y:y+h, x:x+w]
        if roi.size == 0:
            continue

        text, conf = ocr_region(roi)
        if text and validate_plate(text) and conf >= 20:   # Minimum 20% confidence
            results.append({
                'plate':      text,
                'confidence': conf,
                'roi':        roi,
                'bbox':       (x, y, w, h),
            })

    # Deduplicate — keep highest confidence per unique plate
    seen = {}
    for r in results:
        p = r['plate']
        if p not in seen or r['confidence'] > seen[p]['confidence']:
            seen[p] = r

    return list(seen.values())
