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
        gray = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2GRAY)
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

        # 10. Focal Lesion Presence & Saliency Analysis (Distinguish Healthy Normal Skin from Focal Lesion)
        has_lesion = True
        lesion_ratio = 0.0
        contrast_std = 0.0
        if is_skin and roi_pixels >= 200:
            # 1. High-frequency / Local Saliency via Difference of Gaussians (DoG)
            blur_small = cv2.GaussianBlur(gray, (7, 7), 0)
            blur_large = cv2.GaussianBlur(gray, (35, 35), 0)
            dog = np.abs(blur_small.astype(float) - blur_large.astype(float))

            # 2. Chrominance variation (Melanin / Vascular redness deviation)
            a_ch = lab[:, :, 1].astype(float)
            b_ch = lab[:, :, 2].astype(float)
            med_a = float(np.median(a_ch[non_vignette]))
            med_b = float(np.median(b_ch[non_vignette]))
            chroma_dev = np.sqrt((a_ch - med_a) ** 2 + (b_ch - med_b) ** 2)

            # 3. Local color deviation against illumination-corrected background
            k_w = int(w * 0.20) | 1
            k_h = int(h * 0.20) | 1
            bg_L = cv2.GaussianBlur(gray.astype(float), (k_w, k_h), 0)
            bg_a = cv2.GaussianBlur(a_ch, (k_w, k_h), 0)
            bg_b = cv2.GaussianBlur(b_ch, (k_w, k_h), 0)

            lum_dev = np.abs(gray.astype(float) - bg_L)
            c_dev = np.sqrt((a_ch - bg_a) ** 2 + (b_ch - bg_b) ** 2)
            combined_dev = np.sqrt(lum_dev ** 2 + c_dev ** 2)

            # Focal anomaly: sharp edge/dog >= 18, local color deviation >= 10.5, or chroma shift >= 14
            focal_mask = (
                ((combined_dev > 10.5) | (dog > 18.0) | (chroma_dev > 14.0))
                & non_vignette
            )

            # Morphological filtering to eliminate micro-pores and hair noise
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            cleaned = cv2.morphologyEx(focal_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
            cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)

            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(cleaned)
            max_lesion_ratio = 0.0
            genuine_lesion_found = False

            for i in range(1, num_labels):
                area = int(stats[i, cv2.CC_STAT_AREA])
                comp_ratio = float((area / roi_pixels) * 100.0)
                cx = int(stats[i, cv2.CC_STAT_LEFT])
                cy = int(stats[i, cv2.CC_STAT_TOP])
                cw = int(stats[i, cv2.CC_STAT_WIDTH])
                ch = int(stats[i, cv2.CC_STAT_HEIGHT])

                # Reject border-spanning shadows (lighting falloff along the whole sensor edge)
                touches_left = (cx <= 4)
                touches_right = (cx + cw >= w - 4)
                touches_top = (cy <= 4)
                touches_bottom = (cy + ch >= h - 4)
                is_border_shadow = (
                    (touches_left and touches_right)
                    or (touches_top and touches_bottom)
                    or ((touches_left or touches_right) and (touches_top or touches_bottom) and comp_ratio > 15.0)
                )

                # Genuine focal lesion: not a border-spanning shadow, with at least 200 pixels
                if not is_border_shadow and area >= 200:
                    genuine_lesion_found = True
                    if comp_ratio > max_lesion_ratio:
                        max_lesion_ratio = comp_ratio

            lesion_ratio = max_lesion_ratio
            contrast_std = float(np.std(combined_dev[non_vignette]))
            has_lesion = bool(genuine_lesion_found and max_lesion_ratio > 0.0)

        return {
            "is_skin": bool(is_skin),
            "skin_percentage": skin_percentage,
            "confidence_score": round(confidence, 2),
            "phototype": phototype_estimate,
            "has_lesion": bool(has_lesion),
            "lesion_ratio": round(lesion_ratio, 2),
            "contrast_std": round(contrast_std, 2),
            "issues": issues,
            "recommendations": recommendations,
            "message": message,
            "details": {
                "roi_percentage": round((roi_pixels / total_pixels) * 100.0, 1),
                "texture_std_dev": round(texture_std, 1),
                "green_ratio": round(green_ratio, 3),
                "blue_ratio": round(blue_ratio, 3),
                "has_lesion": bool(has_lesion),
                "lesion_ratio": round(lesion_ratio, 2),
                "contrast_std": round(contrast_std, 2),
            },
        }

    @classmethod
    def _rejection_payload(cls, message: str) -> Dict[str, Any]:
        return {
            "is_skin": False,
            "skin_percentage": 0.0,
            "confidence_score": 0.0,
            "phototype": "Indeterminate",
            "has_lesion": False,
            "lesion_ratio": 0.0,
            "contrast_std": 0.0,
            "issues": [message],
            "recommendations": ["Upload a valid image of a skin lesion."],
            "message": message,
            "details": {},
        }

    @classmethod
    def detect_lesion_presence(
        cls, image_input: Union[bytes, bytearray, np.ndarray, Image.Image, str, Path]
    ) -> Dict[str, Any]:
        """Evaluates whether an image contains a focal dermatological lesion or uniform normal skin."""
        res = cls.validate(image_input)
        return {
            "is_skin": res["is_skin"],
            "has_lesion": res.get("has_lesion", True),
            "lesion_ratio": res.get("lesion_ratio", 0.0),
            "contrast_std": res.get("contrast_std", 0.0),
            "phototype": res.get("phototype", "Indeterminate"),
            "confidence_score": res.get("confidence_score", 0.0),
            "message": res.get("message", ""),
        }


def validate_skin_presence(
    image_input: Union[bytes, bytearray, np.ndarray, Image.Image, str, Path]
) -> Dict[str, Any]:
    """Convenience functional wrapper for SkinDomainValidator.validate."""
    return SkinDomainValidator.validate(image_input)


def detect_lesion_presence(
    image_input: Union[bytes, bytearray, np.ndarray, Image.Image, str, Path]
) -> Dict[str, Any]:
    """Convenience functional wrapper for SkinDomainValidator.detect_lesion_presence."""
    return SkinDomainValidator.detect_lesion_presence(image_input)
