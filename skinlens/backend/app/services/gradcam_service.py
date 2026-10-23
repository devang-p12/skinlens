"""Real Grad-CAM (Gradient-weighted Class Activation Mapping) Service.

Calculates genuine Grad-CAM interpretability heatmaps using the fine-tuned
EfficientNet-B0 model (adeIaide/skin-lesion-7class-efficientnet).

Layer Hooked: Final convolutional feature projection layer of EfficientNet-B0
              (model.encoder[0][-1] -> Conv2dNormActivation: Conv2d(320, 1280))

Important Notice:
"Grad-CAM is an interpretability aid and does not prove clinical correctness."
"""

from __future__ import annotations

import io
import logging
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import cv2
import numpy as np
import torch
from PIL import Image, UnidentifiedImageError

from .model_service import CLASS_MAPPING, model_service

logger = logging.getLogger(__name__)

# Base directory for saving generated results
BASE_DIR = Path(__file__).resolve().parent.parent.parent
RESULTS_DIR = BASE_DIR / "generated_results"
HEATMAP_DIR = RESULTS_DIR / "heatmap"
OVERLAY_DIR = RESULTS_DIR / "overlay"

# Ensure directories exist
HEATMAP_DIR.mkdir(parents=True, exist_ok=True)
OVERLAY_DIR.mkdir(parents=True, exist_ok=True)


class RealGradCAM:
    """Computes genuine Grad-CAM heatmaps and visual overlays for EfficientNet-B0."""

    def __init__(self) -> None:
        if not model_service.is_loaded:
            model_service.load_model()

        self.model = model_service.model
        if self.model is None:
            raise RuntimeError("Underlying EfficientNet-B0 model is not loaded")

        self.device = model_service.device
        self.transform = model_service.transform
        self.config = model_service.config

        # 1. Identify the correct convolutional feature layer
        # model.encoder[0] is nn.Sequential(features), with 9 blocks (0..8)
        # Block 8 (the last block) is Conv2dNormActivation projecting features to 1280 dims
        self.target_layer = self.model.encoder[0][-1]

    def generate(
        self,
        image_input: Union[bytes, bytearray, Image.Image, str, Path],
        target_class_idx: Optional[int] = None,
        alpha: float = 0.45,
    ) -> Dict[str, Any]:
        """Generates real Grad-CAM heatmap and overlay images.

        Args:
            image_input: Raw image bytes, PIL Image, or file path.
            target_class_idx: Optional class index to visualize. If None, uses the model's
                              actual top predicted class.
            alpha: Heatmap blend weight (0.0 to 1.0).

        Returns:
            Dictionary containing heatmap_url, overlay_url, predicted_class, confidence,
            and clinical interpretability disclaimer.
        """
        # Load original image and prepare BGR OpenCV representation
        pil_img, orig_bgr = self._load_image_pair(image_input)
        orig_h, orig_w = orig_bgr.shape[:2]

        # Preprocess input tensor with gradient tracking enabled
        tensor = self.transform(pil_img).unsqueeze(0).to(self.device).requires_grad_(True)

        activations: List[torch.Tensor] = []
        gradients: List[torch.Tensor] = []

        # 2. Capture activations via forward hook
        def forward_hook(module, inp, out):
            activations.append(out)

        # 3. Capture gradients via backward hook
        def backward_hook(module, grad_in, grad_out):
            gradients.append(grad_out[0])

        h_fwd = self.target_layer.register_forward_hook(forward_hook)
        h_bwd = self.target_layer.register_full_backward_hook(backward_hook)

        try:
            # Forward pass
            logits = self.model(tensor)
            probabilities = torch.softmax(logits, dim=1)[0]

            # Determine target class (defaults to actual predicted class)
            if target_class_idx is None:
                target_idx = int(torch.argmax(probabilities).item())
            else:
                target_idx = int(target_class_idx)

            pred_confidence = float(probabilities[target_idx].item())
            class_names: List[str] = self.config.get(
                "class_names", ["MEL", "NV", "BCC", "AKIEC", "BKL", "DF", "VASC"]
            )
            raw_code = class_names[target_idx] if target_idx < len(class_names) else f"CLASS_{target_idx}"
            display_name = CLASS_MAPPING.get(raw_code, raw_code)

            # Backward pass for the target class
            self.model.zero_grad()
            target_score = logits[0, target_idx]
            target_score.backward()

            if not activations or not gradients:
                raise RuntimeError("Failed to capture feature activations or gradients for Grad-CAM")

            act = activations[0]  # [1, 1280, H, W]
            grad = gradients[0]   # [1, 1280, H, W]

            # 4. Calculate Grad-CAM
            # Global average pooling of gradients to obtain importance weights alpha_k
            weights = torch.mean(grad, dim=(2, 3), keepdim=True)  # [1, 1280, 1, 1]

            # Weighted linear combination of activation maps
            cam = torch.sum(weights * act, dim=1, keepdim=True)  # [1, 1, H, W]

            # Apply ReLU: only positive influences on the target class
            cam = torch.relu(cam)
            cam_np = cam.squeeze().detach().cpu().numpy().astype(np.float32)

            # 5. Normalize the heatmap to [0.0, 1.0]
            cam_min = float(cam_np.min())
            cam_max = float(cam_np.max())
            if (cam_max - cam_min) > 1e-7:
                norm_cam = (cam_np - cam_min) / (cam_max - cam_min)
            else:
                norm_cam = np.zeros_like(cam_np)

            # 6. Resize heatmap to original image dimensions
            resized_cam = cv2.resize(
                norm_cam, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR
            )

            # 7. Generate a heatmap image (JET colormap)
            heatmap_uint8 = np.uint8(255 * resized_cam)
            heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

            # 8. Generate a heatmap overlay on the original image
            blend_alpha = float(np.clip(alpha, 0.1, 0.9))
            overlay = cv2.addWeighted(
                orig_bgr, 1.0 - blend_alpha, heatmap_colored, blend_alpha, 0
            )

            # Generate unique filenames and save to disk
            file_id = uuid.uuid4().hex[:12]
            heatmap_filename = f"{file_id}_heatmap.jpg"
            overlay_filename = f"{file_id}_overlay.jpg"

            heatmap_path = HEATMAP_DIR / heatmap_filename
            overlay_path = OVERLAY_DIR / overlay_filename

            cv2.imwrite(str(heatmap_path), heatmap_colored)
            cv2.imwrite(str(overlay_path), overlay)

            return {
                "heatmap_url": f"/results/heatmap/{heatmap_filename}",
                "overlay_url": f"/results/overlay/{overlay_filename}",
                "predicted_class": display_name,
                "class_code": raw_code,
                "confidence": round(pred_confidence, 4),
                "disclaimer": "Grad-CAM is an interpretability aid and does not prove clinical correctness.",
            }

        finally:
            # Always cleanly detach hooks
            h_fwd.remove()
            h_bwd.remove()

    def _load_image_pair(
        self, image_input: Union[bytes, bytearray, Image.Image, str, Path]
    ) -> Tuple[Image.Image, np.ndarray]:
        """Loads RGB PIL Image and BGR OpenCV numpy array from various input formats."""
        if isinstance(image_input, (bytes, bytearray)):
            try:
                pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
                # Convert RGB to BGR for OpenCV
                rgb_arr = np.array(pil_img)
                bgr_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
                return pil_img, bgr_arr
            except (UnidentifiedImageError, OSError) as err:
                raise ValueError("Could not decode image input bytes into an image") from err
        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
            rgb_arr = np.array(pil_img)
            bgr_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
            return pil_img, bgr_arr
        elif isinstance(image_input, (str, Path)):
            path = Path(image_input)
            if not path.exists():
                raise FileNotFoundError(f"Image not found at {path}")
            pil_img = Image.open(path).convert("RGB")
            bgr_arr = cv2.imread(str(path))
            if bgr_arr is None:
                raise ValueError(f"OpenCV could not read image at {path}")
            return pil_img, bgr_arr
        else:
            raise TypeError(f"Unsupported image input type: {type(image_input)}")


# Singleton instance
_gradcam_instance: Optional[RealGradCAM] = None


def get_gradcam_service() -> RealGradCAM:
    """Returns the singleton RealGradCAM instance."""
    global _gradcam_instance
    if _gradcam_instance is None:
        _gradcam_instance = RealGradCAM()
    return _gradcam_instance


# Keep GradCAMService as alias for backwards compatibility
class GradCAMService:
    """Wrapper class delegating to real Grad-CAM engine."""

    @staticmethod
    def generate_explanation(
        image_bytes: bytes,
        condition_code: str = "",
        diagnosis_name: str = "",
        confidence: float = 0.0,
    ) -> Dict[str, Any]:
        """Computes real Grad-CAM heatmap and overlay."""
        engine = get_gradcam_service()
        return engine.generate(image_bytes)
