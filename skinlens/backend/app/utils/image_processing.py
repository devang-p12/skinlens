import io
import base64
from typing import Tuple, Dict, Any
import numpy as np
from PIL import Image
import cv2

def bytes_to_pil(image_bytes: bytes) -> Image.Image:
    """Converts raw image bytes to a PIL Image in RGB format."""
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image

def bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
    """Converts raw image bytes to an OpenCV BGR numpy array."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes")
    return img

def cv2_to_base64_data_url(cv_img: np.ndarray, format: str = "jpeg") -> str:
    """Encodes an OpenCV image to a base64 data URL."""
    _, buffer = cv2.imencode(f".{format}", cv_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/{format};base64,{b64_str}"

def pil_to_base64_data_url(pil_img: Image.Image, format: str = "JPEG") -> str:
    """Encodes a PIL image to a base64 data URL."""
    buffer = io.BytesIO()
    pil_img.save(buffer, format=format, quality=85)
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/{format.lower()};base64,{b64_str}"

def calculate_sharpness(cv_img: np.ndarray) -> Tuple[float, float]:
    """
    Computes image sharpness using the Laplacian variance method.
    Returns (normalized_score_0_to_100, raw_variance).
    Standard clinical dermoscopy threshold: variance > 100 is sharp.
    """
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    var = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Normalize to 0-100 scale: 0 var -> 0 score, 200+ var -> ~90-100 score
    normalized = min(100.0, max(5.0, (var / 180.0) * 100.0))
    return round(float(normalized), 1), round(float(var), 2)

def calculate_lighting_and_contrast(cv_img: np.ndarray) -> Dict[str, float]:
    """
    Computes lighting/exposure and contrast metrics.
    Lighting: based on mean luminance (ideal ~ 100-160).
    Contrast: based on standard deviation of luminance (ideal ~ 40-75).
    """
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    mean_val = float(np.mean(gray))
    std_val = float(np.std(gray))
    
    # Lighting score: 128 is center (100%), penalize extremes
    diff = abs(mean_val - 128.0)
    lighting_score = max(10.0, 100.0 - (diff * 0.9))
    
    # Contrast score: std between 40 and 70 is ideal
    contrast_score = min(100.0, max(15.0, (std_val / 55.0) * 85.0))
    
    return {
        "lighting_score": round(float(lighting_score), 1),
        "contrast_score": round(float(contrast_score), 1),
        "mean_luminance": round(mean_val, 1),
        "contrast_std": round(std_val, 1)
    }
