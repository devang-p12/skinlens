import numpy as np
from PIL import Image
import cv2

from ..models.schemas import ImageQualityResult, ImageResolution
from ..utils.image_processing import (
    bytes_to_cv2,
    calculate_sharpness,
    calculate_lighting_and_contrast
)

class ImageQualityService:
    @staticmethod
    def assess_quality(image_bytes: bytes) -> ImageQualityResult:
        """
        Analyzes uploaded dermoscopy/clinical skin image for optical quality:
        - Sharpness (blur detection)
        - Illumination balance & glare
        - Contrast distribution
        - Spatial resolution
        """
        cv_img = bytes_to_cv2(image_bytes)
        height, width = cv_img.shape[:2]
        
        sharpness_score, raw_var = calculate_sharpness(cv_img)
        lc = calculate_lighting_and_contrast(cv_img)
        lighting_score = lc["lighting_score"]
        contrast_score = lc["contrast_score"]
        
        issues = []
        recommendations = []
        
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
        composite_score = (sharpness_score * 0.45) + (lighting_score * 0.35) + (contrast_score * 0.20)
        
        if composite_score >= 75.0 and len(issues) == 0:
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
            recommendations.append("Image quality meets dermatological AI screening standards.")

        return ImageQualityResult(
            is_acceptable=is_acceptable,
            quality_rating=rating,
            sharpness_score=sharpness_score,
            lighting_score=lighting_score,
            contrast_score=contrast_score,
            resolution=ImageResolution(width=width, height=height),
            issues=issues,
            recommendations=recommendations,
        )
