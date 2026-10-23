"""Prototype Image Quality Validation Service.

Performs basic prototype-level heuristics using OpenCV and Pillow:
- Image format validation (JPEG, PNG, WEBP, BMP)
- Spatial resolution check
- Blur detection (Laplacian variance)
- Brightness / exposure evaluation (mean luminance)
- Contrast evaluation (luminance standard deviation)

NOTE: This service provides basic prototype-level checks and is NOT clinically validated.
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError


class ImageQualityValidator:
    """Evaluates uploaded skin lesion images for optical quality heuristics."""

    ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP", "BMP", "TIFF"}
    MIN_WIDTH = 200
    MIN_HEIGHT = 200
    MIN_BLUR_VAR = 2.0  # Threshold under which image is considered heavily blurred
    MIN_BRIGHTNESS = 35.0  # Underexposed if below
    MAX_BRIGHTNESS = 230.0  # Overexposed / white glare if above
    MIN_CONTRAST = 15.0  # Flat / washed-out if below

    @classmethod
    def validate(
        cls, image_input: Union[bytes, bytearray, Image.Image, str, Path]
    ) -> Dict[str, Any]:
        """Performs prototype-level quality checks on the provided image input.

        Returns a dictionary with:
        - valid: bool
        - quality_score: float (0.0 to 1.0)
        - checks: dict of bools (format, resolution, blur, brightness, contrast)
        - message: descriptive guidance string
        - details: raw measured metrics
        - disclaimer: notice that checks are prototype-level, not clinically validated
        """
        # 1. Parse Image & Check Format
        format_valid = True
        img_format = "UNKNOWN"
        pil_image: Optional[Image.Image] = None

        if isinstance(image_input, (bytes, bytearray)):
            try:
                pil_image = Image.open(io.BytesIO(image_input))
                img_format = (pil_image.format or "UNKNOWN").upper()
                format_valid = img_format in cls.ALLOWED_FORMATS
            except (UnidentifiedImageError, OSError):
                return {
                    "valid": False,
                    "quality_score": 0.0,
                    "checks": {
                        "resolution": False,
                        "blur": False,
                        "brightness": False,
                        "format": False,
                    },
                    "message": "The uploaded file could not be decoded as an image. Please upload a valid JPEG, PNG, or WebP photo.",
                    "details": {"format": "INVALID"},
                    "disclaimer": "Prototype-level quality check. Not clinically validated.",
                }
        elif isinstance(image_input, Image.Image):
            pil_image = image_input
            img_format = (pil_image.format or "PNG").upper()
            format_valid = True
        elif isinstance(image_input, (str, Path)):
            path = Path(image_input)
            if not path.exists():
                raise FileNotFoundError(f"Image file not found: {path}")
            try:
                pil_image = Image.open(path)
                img_format = (pil_image.format or path.suffix.strip(".").upper()).upper()
                format_valid = img_format in cls.ALLOWED_FORMATS
            except (UnidentifiedImageError, OSError):
                return {
                    "valid": False,
                    "quality_score": 0.0,
                    "checks": {
                        "resolution": False,
                        "blur": False,
                        "brightness": False,
                        "format": False,
                    },
                    "message": "The specified file is not a valid image format.",
                    "details": {"format": "INVALID"},
                    "disclaimer": "Prototype-level quality check. Not clinically validated.",
                }
        else:
            raise TypeError(f"Unsupported image input type: {type(image_input)}")

        # Convert to RGB and OpenCV format
        rgb_image = pil_image.convert("RGB")
        width, height = rgb_image.size
        cv_img = np.array(rgb_image)  # RGB uint8 numpy array
        gray = cv2.cvtColor(cv_img, cv2.COLOR_RGB2GRAY)

        # 2. Resolution check
        resolution_valid = width >= cls.MIN_WIDTH and height >= cls.MIN_HEIGHT

        # 3. Blur check (Laplacian variance)
        blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        blur_valid = blur_var >= cls.MIN_BLUR_VAR

        # 4. Brightness check (Mean luminance)
        mean_brightness = float(np.mean(gray))
        brightness_valid = cls.MIN_BRIGHTNESS <= mean_brightness <= cls.MAX_BRIGHTNESS

        # 5. Contrast check (Standard deviation of luminance)
        std_contrast = float(np.std(gray))
        contrast_valid = std_contrast >= cls.MIN_CONTRAST

        # Overall validity: must pass format, resolution, blur, and brightness
        is_valid = bool(
            format_valid and resolution_valid and blur_valid and brightness_valid
        )

        # Calculate composite quality score (0.0 to 1.0)
        # Resolution factor (optimal >= 500px)
        res_factor = min(1.0, max(0.2, (width * height) / (500.0 * 500.0)))

        # Brightness factor (optimal ~ 128)
        brightness_dist = abs(mean_brightness - 128.0)
        bright_factor = max(0.1, 1.0 - (brightness_dist / 128.0))

        # Contrast factor (optimal ~ 50)
        contrast_factor = min(1.0, max(0.1, std_contrast / 55.0))

        # Sharpness factor
        sharp_factor = min(1.0, max(0.1, blur_var / 25.0)) if blur_var >= cls.MIN_BLUR_VAR else 0.1

        composite_score = (
            (res_factor * 0.30)
            + (bright_factor * 0.30)
            + (contrast_factor * 0.20)
            + (sharp_factor * 0.20)
        )
        quality_score = round(float(np.clip(composite_score, 0.05, 0.99)), 2)

        # Build user-friendly message
        issues = []
        if not format_valid:
            issues.append(f"unsupported format ({img_format})")
        if not resolution_valid:
            issues.append(f"low resolution ({width}x{height}px, minimum {cls.MIN_WIDTH}x{cls.MIN_HEIGHT}px)")
        if not blur_valid:
            issues.append("significant blur or lack of edge sharpness")
        if not brightness_valid:
            if mean_brightness < cls.MIN_BRIGHTNESS:
                issues.append("underexposed / too dark")
            else:
                issues.append("overexposed / excessive glare")
        if not contrast_valid:
            issues.append("insufficient contrast / washed out")

        if is_valid:
            message = "Image quality meets basic prototype requirements for screening."
        else:
            issues_str = ", ".join(issues)
            message = (
                f"The image is unsuitable for reliable evaluation ({issues_str}). "
                "Please upload a clearer image that is in focus, well-lit, and centered on the lesion."
            )

        return {
            "valid": is_valid,
            "quality_score": quality_score,
            "checks": {
                "resolution": resolution_valid,
                "blur": blur_valid,
                "brightness": brightness_valid,
                "format": format_valid,
            },
            "message": message,
            "details": {
                "format": img_format,
                "resolution": {"width": width, "height": height},
                "blur_variance": round(blur_var, 2),
                "brightness_mean": round(mean_brightness, 1),
                "contrast_std": round(std_contrast, 1),
            },
            "disclaimer": "This automated quality check is a prototype-level heuristic and is NOT clinically validated.",
        }


def validate_image_quality(
    image_input: Union[bytes, bytearray, Image.Image, str, Path]
) -> Dict[str, Any]:
    """Convenience functional wrapper for ImageQualityValidator.validate."""
    return ImageQualityValidator.validate(image_input)
