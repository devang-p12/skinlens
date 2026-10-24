import numpy as np
from PIL import Image
import cv2

from ..models.schemas import ImageQualityResult, ImageResolution
from .skin_validator import SkinDomainValidator
from ..utils.image_processing import (
    bytes_to_cv2,
    calculate_sharpness,
    calculate_lighting_and_contrast
)

class ImageQualityService:
    @staticmethod
    def assess_quality(image_bytes: bytes) -> ImageQualityResult:
        """
        Analyzes uploaded dermoscopy/clinical skin image for optical quality and skin presence:
        - Human skin tissue validation (pre-classification domain gate)
        - Sharpness (blur detection)
        - Illumination balance & glare
        - Contrast distribution
        - Spatial resolution
        """
        cv_img = bytes_to_cv2(image_bytes)
        height, width = cv_img.shape[:2]
        
        # 1. Skin Domain Validation Gate
        skin_val = SkinDomainValidator.validate(cv_img)
        is_skin = bool(skin_val.get("is_skin", True))
        skin_percentage = float(skin_val.get("skin_percentage", 100.0))
        phototype = str(skin_val.get("phototype", "Indeterminate"))
        
        sharpness_score, raw_var = calculate_sharpness(cv_img)
        lc = calculate_lighting_and_contrast(cv_img)
        lighting_score = lc["lighting_score"]
        contrast_score = lc["contrast_score"]
        
        issues = []
        recommendations = []
        
        # Non-skin rejection
        if not is_skin:
            issues.extend(skin_val.get("issues", ["Non-skin image detected"]))
            recommendations.extend(skin_val.get("recommendations", ["Please upload an image of human skin."]))
        
        # Blur check
        if sharpness_score < 35.0:
            issues.append(f"High motion blur detected (Laplacian variance: {raw_var})")
            recommendations.append("Stabilize camera and keep 10-15cm distance or use a dermatoscope attachment.")
        elif sharpness_score < 55.0:
            issues.append("Moderate blur; fine pigment network details may be softened")
            recommendations.append("Re-focusing recommended for subtle border evaluation.")
            
        # Lighting check
        if lc["mean_luminance"] < 70.0:
            issues.append("Under-exposed image (too dark)")
            recommendations.append("Increase ambient lighting or use gentle uniform dermoscopy illumination.")
        elif lc["mean_luminance"] > 200.0:
            issues.append("Over-exposed / specular glare detected")
            recommendations.append("Reduce direct flash to prevent white-out over lesion core.")
            
        # Resolution check
        if width < 250 or height < 250:
            issues.append(f"Low resolution: {width}x{height}px")
            recommendations.append("Upload image of at least 500x500 pixels for micro-pattern AI segmentation.")
            
        # Overall quality score
        composite_score = (sharpness_score * 0.40) + (lighting_score * 0.30) + (contrast_score * 0.15) + ((skin_percentage / 100.0) * 15.0 if is_skin else 0.0)
        
        if not is_skin:
            rating = "Unacceptable"
            is_acceptable = False
            issues.insert(0, f"Non-skin image detected ({skin_percentage}% skin coverage).")
        elif composite_score >= 75.0 and len(issues) == 0:
            rating = "Optimal"
            is_acceptable = True
        elif composite_score >= 50.0 and len(issues) <= 1:
            rating = "Good"
            is_acceptable = True
        elif composite_score >= 35.0:
            rating = "Sub-optimal"
            is_acceptable = True
            issues.append("Image usable with caveat for automated border analysis.")
        else:
            rating = "Unacceptable"
            is_acceptable = False
            issues.append("Image quality too low for reliable neural feature extraction.")
            recommendations.insert(0, "Please capture a new higher-fidelity image.")

        if not recommendations:
            recommendations.append(f"Image quality meets dermatological AI screening standards ({skin_percentage}% skin verified, {phototype}).")

        return ImageQualityResult(
            is_acceptable=is_acceptable,
            quality_rating=rating,
            sharpness_score=sharpness_score,
            lighting_score=lighting_score,
            contrast_score=contrast_score,
            resolution=ImageResolution(width=width, height=height),
            skin_detected=is_skin,
            skin_percentage=skin_percentage,
            phototype=phototype,
            issues=issues,
            recommendations=recommendations,
        )

