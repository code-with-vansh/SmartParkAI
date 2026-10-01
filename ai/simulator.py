#!/usr/bin/env python3
# ─── simulator.py ─────────────────────────────────────────────────────────────
# Smart Park AI — Plate Detection Simulator
#
# Simulates ANPR without a real camera or video file.
# Sends fake plate detections to the backend at regular intervals.
# Useful for testing the full system end-to-end.
#
# Usage:
#   python simulator.py                  # Continuous random simulation
#   python simulator.py --count 20       # Send 20 detections then stop
#   python simulator.py --interval 3     # 3 seconds between detections
#   python simulator.py --plate MH12AB1234  # Send a specific plate

import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import time
import random
import argparse
import requests
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger('simulator')

BACKEND_URL = 'http://localhost:5000/api'

# ── Sample plate pool ─────────────────────────────────────────────────────────
# Mix of known (add some to your Members DB) and unknown plates
SAMPLE_PLATES = [
    'MH12AB1234',  # → Register these in Members for realistic testing
    'MH01CD5678',
    'MH04EF9012',
    'KA05GH3456',
    'DL07IJ7890',
    'TN09KL2345',
    'GJ11MN6789',  # Unknown — will trigger popup
    'UP14OP1357',  # Unknown
    'RJ16QR2468',  # Unknown
    'WB18ST3579',  # Unknown — Delivery
    'MH20UV4680',  # Unknown — Guest
    'PB22WX5791',
]


def generate_random_plate():
    """Generate a random Indian-style plate number."""
    states = ['MH', 'KA', 'DL', 'TN', 'GJ', 'UP', 'RJ', 'WB', 'PB', 'HR']
    state  = random.choice(states)
    num    = random.randint(1, 30)
    alpha  = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=2))
    digits = random.randint(1000, 9999)
    return f'{state}{num:02d}{alpha}{digits}'


def send_plate(plate, confidence=None):
    """Send a plate detection to the backend."""
    conf = confidence or round(random.uniform(70, 98), 1)
    payload = {
        'plateNumber': plate,
        'plateImage':  '',
        'confidence':  conf,
    }
    try:
        r = requests.post(f'{BACKEND_URL}/detect', json=payload, timeout=5)
        data = r.json()
        status = data.get('status', 'unknown')
        action = data.get('action', '')
        person = data.get('person', {})

        if status == 'known':
            icon = '🟢' if action == 'ENTRY' else '🔴'
            logger.info(f"{icon} [{action}] {plate}  →  {person.get('name')} ({person.get('type')}) Zone {person.get('zone')}")
        elif status == 'unknown':
            logger.info(f"🟡 [UNKNOWN] {plate}  →  No record found (popup would show in frontend)")
        elif status == 'duplicate':
            logger.info(f"⚪ [DUPLICATE] {plate}  →  Ignored (seen too recently)")
        else:
            logger.info(f"❓ [{status}] {plate}")

        return data
    except requests.exceptions.ConnectionError:
        logger.error('Cannot connect to backend! Make sure server is running on port 5000.')
        return {}
    except Exception as e:
        logger.error(f'Error: {e}')
        return {}


def run_simulation(args):
    """Main simulation loop."""
    plates   = args.plate.split(',') if args.plate else None
    count    = args.count    # None = infinite
    interval = args.interval

    logger.info("=" * 55)
    logger.info("  Smart Park AI — Plate Simulator")
    logger.info(f"  Backend: {BACKEND_URL}")
    logger.info(f"  Interval: {interval}s  |  Count: {'∞' if not count else count}")
    logger.info("=" * 55)
    logger.info("")

    # Check backend is alive
    try:
        r = requests.get(f'{BACKEND_URL}/health', timeout=3)
        logger.info(f"✅ Backend is online: {r.json()}")
    except Exception:
        logger.error("❌ Backend is not reachable. Start the server first!")
        sys.exit(1)

    logger.info("")

    sent = 0
    while True:
        if plates:
            # Cycle through the provided plates
            plate = plates[sent % len(plates)]
        elif args.random:
            plate = generate_random_plate()
        else:
            # Cycle through the sample pool
            plate = SAMPLE_PLATES[sent % len(SAMPLE_PLATES)]

        send_plate(plate)
        sent += 1

        if count and sent >= count:
            logger.info(f"\n✅ Simulation complete — {sent} plates sent.")
            break

        time.sleep(interval)


def parse_args():
    p = argparse.ArgumentParser(description='Smart Park AI — Simulator')
    p.add_argument('--plate',    type=str, default=None,
                   help='Specific plate(s) to send (comma-separated). E.g. MH12AB1234,KA05GH3456')
    p.add_argument('--count',    type=int, default=None,
                   help='Number of plates to send (default: infinite)')
    p.add_argument('--interval', type=float, default=3.0,
                   help='Seconds between detections (default: 3)')
    p.add_argument('--random',   action='store_true',
                   help='Generate random plates instead of using sample pool')
    return p.parse_args()


if __name__ == '__main__':
    args = parse_args()
    run_simulation(args)