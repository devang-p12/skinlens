"""Skin Domain & Tissue Validation Service.

Validates whether an uploaded image contains genuine human cutaneous tissue
(clinical skin surface or dermoscopic lesion) before passing it to deep learning
classification models.

Safeguard Rationale:
--------------------
Standard classification models (e.g., EfficientNet-B0 trained on HAM10000) operate
with a closed-world softmax assumption over 7 dermatological classes. If an arbitrary
out-of-distribution image (such as an animal, automobile, document, furniture, or landscape)
is supplied, the network will forcibly assign it high confidence in a malignancy category.
This module enforces an automated biological and optical pre-gate:
1. Multi-space bio-optical chrominance analysis (YCbCr + HSV + Lab + RGB).
2. Skin tissue coverage quantification across Region-Of-Interest (excluding dermoscopy aperture vignetting).
3. Cutaneous entropy and texture variance checks to reject flat graphics and documents.
4. Non-skin dominant pigmentation rejection (foliage greens, atmospheric blues).
"""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError


class SkinDomainValidator:
    """Automated pre-classification gate to confirm presence of human skin tissue."""

    MIN_SKIN_COVERAGE_PERCENT: float = 25.0
    MIN_TEXTURE_STD_DEV: float = 6.0
    MAX_GREEN_RATIO: float = 0.35
    MAX_BLUE_RATIO: float = 0.35

    @classmethod
    def validate(
        cls, image_input: Union[bytes, bytearray, np.ndarray, Image.Image, str, Path]
    ) -> Dict[str, Any]:
        """Validates whether the provided image contains human skin tissue.

        Parameters
        ----------
        image_input : bytes, numpy array, PIL Image, or file path

        Returns
        -------
        dict containing:
            - is_skin: bool
            - skin_percentage: float (0.0 to 100.0)
            - confidence_score: float (0.0 to 1.0)
            - phototype_estimate: str
            - issues: list of str
            - recommendations: list of str
            - details: dict of raw computed metrics
        """
        # 1. Normalize input to RGB numpy array
        rgb_img: Optional[np.ndarray] = None

        if isinstance(image_input, np.ndarray):
            if image_input.ndim == 2:
                rgb_img = cv2.cvtColor(image_input, cv2.COLOR_GRAY2RGB)
            elif image_input.shape[2] == 4:
                rgb_img = cv2.cvtColor(image_input, cv2.COLOR_RGBA2RGB)
            else:
                # Assume already RGB if 3 channels
                rgb_img = image_input
        elif isinstance(image_input, (bytes, bytearray)):
            try:
                pil_im = Image.open(io.BytesIO(image_input)).convert("RGB")
                rgb_img = np.array(pil_im)
            except Exception:
                return cls._rejection_payload(
                    "Image could not be decoded. Please upload a valid image file."
                )
        elif isinstance(image_input, Image.Image):
            rgb_img = np.array(image_input.convert("RGB"))
        elif isinstance(image_input, (str, Path)):
            path = Path(image_input)
            if not path.exists():
                raise FileNotFoundError(f"Image not found at {path}")
            try:
                pil_im = Image.open(path).convert("RGB")
                rgb_img = np.array(pil_im)
            except Exception:
                return cls._rejection_payload(
                    "Failed to open image file. Ensure it is a valid JPEG, PNG, or WebP photo."
                )
        else:
            raise TypeError(f"Unsupported image type: {type(image_input)}")

        if rgb_img is None or rgb_img.size == 0:
            return cls._rejection_payload("Uploaded image contains zero pixels.")

        h, w = rgb_img.shape[:2]
        total_pixels = h * w

        # 2. Extract color channels
        r = rgb_img[:, :, 0].astype(int)
        g = rgb_img[:, :, 1].astype(int)
        b = rgb_img[:, :, 2].astype(int)

        # 3. Handle Dermoscopy Aperture / Non-optical Vignette
        # Dermatoscope lenses feature circular glass contact plates with black borders
        non_vignette = ~((r < 25) & (g < 25) & (b < 25))
        roi_pixels = max(1, int(np.count_nonzero(non_vignette)))

        # 4. Multi-Space Color Conversions
        # OpenCV expects BGR input for cvtColor
        bgr = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2BGR)
        ycrcb = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)

        Y = ycrcb[:, :, 0]
        Cr = ycrcb[:, :, 1].astype(int)
        Cb = ycrcb[:, :, 2].astype(int)

        H = hsv[:, :, 0]
        S = hsv[:, :, 1]
        V = hsv[:, :, 2]

        # In OpenCV LAB: L in [0, 255], a in [0, 255] (128 neutral), b in [0, 255] (128 neutral)
        b_star = lab[:, :, 2].astype(int) - 128

        # 5. Biological Cutaneous Rules
        # Rule 1: Hemoglobin & Melanin spectral absorption (Red dominates Green and Blue)
        bio_rule = (r > g + 4) & (g >= b - 4) & (r > b + 8)

        # Rule 2: YCrCb chrominance envelope for human skin (Fitzpatrick Types I to VI)
        # Cr is elevated over Cb by at least 10 in human cutaneous tissue
        ycrcb_rule = (
            (Cr - Cb >= 10)
            & (Cr >= 130)
            & (Cr <= 185)
            & (Cb >= 70)
            & (Cb <= 138)
        )

        # Rule 3: HSV warm cutaneous hues (0-28 and 165-180 in OpenCV 0-180 scale)
        hsv_rule = ((H <= 28) | (H >= 165)) & (S >= 18) & (S <= 225) & (V >= 35)

        # Rule 4: LAB yellow chromaticity bound (distinguishes skin from high-lignin wood / orange plastic)
        lab_rule = (b_star >= 2) & (b_star <= 24)

        # Consensus skin mask within the active optical field
        skin_mask = (bio_rule & ycrcb_rule & hsv_rule & lab_rule) & non_vignette
        skin_count = int(np.count_nonzero(skin_mask))
        skin_percentage = round((skin_count / roi_pixels) * 100.0, 1)

        # 6. Environmental & Out-of-Distribution Pigment Checks
        green_count = int(np.count_nonzero((g > r + 15) & (g > b + 15) & non_vignette))
        blue_count = int(np.count_nonzero((b > r + 15) & (b > g + 10) & non_vignette))
        green_ratio = green_count / roi_pixels
        blue_ratio = blue_count / roi_pixels

        # Standard deviation of image (flat synthetic graphic vs natural biological entropy)
        texture_std = float(np.std(rgb_img))

        # 7. Evaluate Domain Validity
        issues: List[str] = []
        recommendations: List[str] = []

        if texture_std < cls.MIN_TEXTURE_STD_DEV:
            issues.append("Image appears to be a synthetic graphic or solid color block.")
            recommendations.append("Upload a real photograph taken with a camera or dermatoscope.")

        if green_ratio > cls.MAX_GREEN_RATIO:
            issues.append(f"Excessive environmental green detected ({round(green_ratio * 100, 1)}%).")
            recommendations.append("Ensure the camera is focused directly on the skin lesion without foliage.")

        if blue_ratio > cls.MAX_BLUE_RATIO:
            issues.append(f"Excessive blue pigmentation detected ({round(blue_ratio * 100, 1)}%).")
            recommendations.append("Avoid capturing bright blue clothing or background fabrics in the frame.")

        if skin_percentage < cls.MIN_SKIN_COVERAGE_PERCENT:
            issues.append(
                f"Insufficient human skin tissue detected ({skin_percentage}% coverage; minimum required is {cls.MIN_SKIN_COVERAGE_PERCENT}%)."
            )
            recommendations.append(
                "SkinLens requires a clear photograph of human skin or a dermoscopic lesion. Please frame the lesion closely."
            )

        is_skin = (
            (skin_percentage >= cls.MIN_SKIN_COVERAGE_PERCENT)
            and (texture_std >= cls.MIN_TEXTURE_STD_DEV)
            and (green_ratio <= cls.MAX_GREEN_RATIO)
            and (blue_ratio <= cls.MAX_BLUE_RATIO)
        )

        # 8. Phototype Estimation
        phototype_estimate = "Indeterminate"
        if is_skin and skin_count > 0:
            mean_y = float(np.mean(Y[skin_mask]))
            if mean_y >= 180:
                phototype_estimate = "Fair / Light (Fitzpatrick I-II)"
            elif mean_y >= 125:
                phototype_estimate = "Medium / Olive (Fitzpatrick III-IV)"
            else:
                phototype_estimate = "Deeply Pigmented / Brown (Fitzpatrick V-VI)"

        # 9. Compute Confidence in Domain
        if is_skin:
            confidence = min(0.99, max(0.70, (skin_percentage / 100.0) * 0.95 + 0.05))
            message = (
                f"Human skin tissue verified ({skin_percentage}% skin coverage, "
                f"estimated {phototype_estimate})."
            )
        else:
            confidence = max(0.05, 1.0 - (skin_percentage / 100.0))
            issue_summary = "; ".join(issues) if issues else "Out-of-distribution image"
            message = (
                f"Non-skin image detected: {issue_summary}. "
                "The neural model cannot process this upload because it is not a dermatological lesion."
            )

        return {
            "is_skin": bool(is_skin),
            "skin_percentage": skin_percentage,
            "confidence_score": round(confidence, 2),
            "phototype": phototype_estimate,
            "issues": issues,
            "recommendations": recommendations,
            "message": message,
            "details": {
                "roi_percentage": round((roi_pixels / total_pixels) * 100.0, 1),
                "texture_std_dev": round(texture_std, 1),
                "green_ratio": round(green_ratio, 3),
                "blue_ratio": round(blue_ratio, 3),
            },
        }

    @classmethod
    def _rejection_payload(cls, message: str) -> Dict[str, Any]:
        return {
            "is_skin": False,
            "skin_percentage": 0.0,
            "confidence_score": 0.0,
            "phototype": "Indeterminate",
            "issues": [message],
            "recommendations": ["Upload a valid image of a skin lesion."],
            "message": message,
            "details": {},
        }


def validate_skin_presence(
    image_input: Union[bytes, bytearray, np.ndarray, Image.Image, str, Path]
) -> Dict[str, Any]:
    """Convenience functional wrapper for SkinDomainValidator.validate."""
    return SkinDomainValidator.validate(image_input)
