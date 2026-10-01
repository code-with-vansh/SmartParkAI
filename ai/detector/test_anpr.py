import unittest
import numpy as np
import cv2
import os
import sys

# Ensure anpr can be imported
sys.path.insert(0, os.path.dirname(__file__))
from anpr import validate_plate, is_valid_plate, clean_plate_text, normalize_plate_text, process_frame


class TestPlateDetectionValidation(unittest.TestCase):

    def test_accepted_examples(self):
        accepted = [
            "DL01AB1234",
            "UP16CD5678",
            "HR26XY9999",
            "MH12AB3456",
        ]
        for plate in accepted:
            with self.subTest(plate=plate):
                self.assertTrue(validate_plate(plate), f"Plate {plate} should be valid")
                self.assertTrue(is_valid_plate(plate), f"Plate {plate} should be valid via is_valid_plate")
                self.assertEqual(clean_plate_text(plate), plate)
                self.assertEqual(normalize_plate_text(plate), plate)

    def test_rejected_examples_validation(self):
        rejected = [
            "A11AA1111",      # 1 letter prefix
            "AAA11AA1111",    # 3 letters prefix
            "DL1AB1234",      # 1 digit district
            "DL01A12345",     # 1 letter series + 5 digits
            "DL01AB123",      # 3 digits at end
            "DL01AB12345",    # 5 digits at end
            "DL-01-AB-1234",  # Hyphens (not exact format AA11AA1111)
            "DL 01 AB 1234",  # Spaces (not exact format AA11AA1111)
            "Random text",
            "Phone numbers",
            "9876543210",
            "STOP",
            "NO PARKING",
            "SPEED LIMIT 40",
            "1234567890",
            "ABCDEFGHIJ",
            "",
            None,
        ]
        for plate in rejected:
            with self.subTest(plate=plate):
                self.assertFalse(validate_plate(plate), f"Plate {plate} should be rejected by validate_plate")
                self.assertFalse(is_valid_plate(plate), f"Plate {plate} should be rejected by is_valid_plate")

    def test_ocr_normalization_valid_inputs(self):
        # Raw inputs from OCR that should normalize to valid AA11AA1111
        cases = [
            ("DL 01 AB 1234", "DL01AB1234"),
            ("dl01ab1234", "DL01AB1234"),
            ("DL-01-AB-1234", "DL01AB1234"),
            ("IND DL01AB1234", "DL01AB1234"),
            ("IND-DL01AB1234", "DL01AB1234"),
            ("INDDL01AB1234", "DL01AB1234"),
            ("UP 16 CD 5678", "UP16CD5678"),
            ("HR 26 XY 9999", "HR26XY9999"),
            ("MH 12 AB 3456", "MH12AB3456"),
            # Common OCR confusions:
            ("DL O1 AB 1234", "DL01AB1234"),  # 'O' in digit spot
            ("DL 01 AB I234", "DL01AB1234"),  # 'I' in digit spot
            ("OD O1 AB 1234", "OD01AB1234"),  # 'O' in digit spot
            ("0D 01 AB 1234", "OD01AB1234"),  # '0' in state letter spot
        ]
        for raw, expected in cases:
            with self.subTest(raw=raw):
                self.assertEqual(clean_plate_text(raw), expected)
                self.assertEqual(normalize_plate_text(raw), expected)

    def test_ocr_normalization_rejected_inputs(self):
        # Texts that should NEVER normalize to a valid plate
        rejected_texts = [
            "A11AA1111",
            "AAA11AA1111",
            "DL1AB1234",
            "DL01A12345",
            "DL01AB123",
            "DL01AB12345",
            "Random text",
            "Phone numbers",
            "9876543210",
            "+91 9876543210",
            "CALL 1800 123 456",
            "SPEED LIMIT 50",
            "CAUTION WIDE LOAD",
            "POLICE",
            "AMBULANCE",
        ]
        for raw in rejected_texts:
            with self.subTest(raw=raw):
                self.assertIsNone(clean_plate_text(raw), f"{raw} should normalize to None")
                self.assertIsNone(normalize_plate_text(raw), f"{raw} should normalize to None")

    def test_process_frame_with_synthetic_images(self):
        # 1. Blank frame
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        self.assertEqual(process_frame(blank), [])

        # 2. Frame with random rectangle and invalid text ("PHONE: 9876543210")
        invalid_frame = np.ones((480, 640, 3), dtype=np.uint8) * 200
        # Draw a plate-like rectangle
        cv2.rectangle(invalid_frame, (100, 200), (350, 270), (255, 255, 255), -1)
        cv2.rectangle(invalid_frame, (100, 200), (350, 270), (0, 0, 0), 2)
        cv2.putText(invalid_frame, "9876543210", (110, 245), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        results = process_frame(invalid_frame)
        self.assertEqual(results, [], f"Invalid text should not produce plate detections: {results}")

        # 3. Frame with valid number plate "DL01AB1234"
        valid_frame = np.ones((480, 640, 3), dtype=np.uint8) * 200
        cv2.rectangle(valid_frame, (100, 200), (400, 280), (255, 255, 255), -1)
        cv2.rectangle(valid_frame, (100, 200), (400, 280), (0, 0, 0), 3)
        cv2.putText(valid_frame, "DL 01 AB 1234", (110, 255), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 0), 3)
        results = process_frame(valid_frame)
        self.assertTrue(len(results) >= 1, f"Expected valid plate detection, got {results}")
        detected_plate = results[0]['plate']
        self.assertEqual(detected_plate, "DL01AB1234")
        self.assertTrue(validate_plate(detected_plate))

    def test_ocr_region_direct(self):
        from anpr import ocr_region

        # 1. Valid plate ROI
        roi_valid = np.ones((80, 260, 3), dtype=np.uint8) * 255
        cv2.putText(roi_valid, "UP 16 CD 5678", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        plate, conf = ocr_region(roi_valid)
        self.assertEqual(plate, "UP16CD5678")
        self.assertGreaterEqual(conf, 20)

        # 2. Invalid plate ROI (5-digit number plate DL01A12345)
        roi_invalid_5digit = np.ones((80, 260, 3), dtype=np.uint8) * 255
        cv2.putText(roi_invalid_5digit, "DL 01 A 12345", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        plate, conf = ocr_region(roi_invalid_5digit)
        self.assertIsNone(plate, "5-digit plate should return None")
        self.assertEqual(conf, 0)

        # 3. Random text ROI
        roi_random = np.ones((80, 260, 3), dtype=np.uint8) * 255
        cv2.putText(roi_random, "PARKING ONLY", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 2)
        plate, conf = ocr_region(roi_random)
        self.assertIsNone(plate, "Random text ROI should return None")
        self.assertEqual(conf, 0)


if __name__ == '__main__':
    unittest.main()
