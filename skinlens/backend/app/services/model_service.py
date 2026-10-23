"""Real PyTorch EfficientNet-B0 Skin Lesion Classification Service.

Integrates fine-tuned model from Hugging Face:
adeIaide/skin-lesion-7class-efficientnet (ISIC 2018 / HAM10000 7-class).

Model Architecture: EfficientNet-B0 (3.7M fine-tuned params)
Input Size: 320x320 RGB
Normalization: ImageNet mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
License: CC-BY-NC-4.0
Framework: PyTorch + safetensors
"""

from __future__ import annotations

import io
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import torch
from huggingface_hub import hf_hub_download
from PIL import Image, UnidentifiedImageError
from safetensors.torch import load_file
from torch import nn
from torchvision import models, transforms

logger = logging.getLogger(__name__)

REPO_ID = "adeIaide/skin-lesion-7class-efficientnet"

# Class label mappings according to ISIC 2018 / HAM10000 benchmark
CLASS_MAPPING: Dict[str, str] = {
    "MEL": "Melanoma",
    "NV": "Nevus",
    "BCC": "BCC",
    "AKIEC": "AKIEC",
    "BKL": "BKL",
    "DF": "DF",
    "VASC": "VASC",
}

FULL_CONDITION_NAMES: Dict[str, str] = {
    "MEL": "Melanoma (Malignant)",
    "NV": "Melanocytic Nevus",
    "BCC": "Basal Cell Carcinoma",
    "AKIEC": "Actinic Keratosis / Intraepithelial Carcinoma",
    "BKL": "Benign Keratosis-like Lesion",
    "DF": "Dermatofibroma",
    "VASC": "Vascular Lesion",
}


class EfficientNetB0(nn.Module):
    """EfficientNet-B0 architecture with custom linear classifier head."""

    def __init__(self, num_classes: int = 7, dropout: float = 0.3) -> None:
        super().__init__()
        network = models.efficientnet_b0(weights=None)
        embedding_dim = network.classifier[1].in_features
        self.encoder = nn.Sequential(network.features, network.avgpool, nn.Flatten(1))
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(embedding_dim, num_classes)

    def forward(self, image: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.dropout(self.encoder(image)))


class ModelService:
    """Singleton service to manage model lifecycle, preprocessing, and inference."""

    _instance: Optional[ModelService] = None

    def __init__(self) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model: Optional[nn.Module] = None
        self.config: Dict[str, Any] = {}
        self.transform: Optional[transforms.Compose] = None
        self.is_loaded: bool = False
        self.load_error: Optional[str] = None

    @classmethod
    def get_instance(cls) -> ModelService:
        if cls._instance is None:
            cls._instance = ModelService()
        return cls._instance

    def load_model(self) -> None:
        """Loads model weights and configuration from Hugging Face Hub (cached locally)."""
        if self.is_loaded:
            logger.info("Model already loaded on device: %s", self.device)
            return

        try:
            logger.info("Loading model from Hugging Face: %s", REPO_ID)
            config_path = hf_hub_download(REPO_ID, "config.json")
            weights_path = hf_hub_download(REPO_ID, "model.safetensors")

            self.config = json.loads(Path(config_path).read_text(encoding="utf-8"))
            num_classes = int(self.config.get("num_classes", 7))
            dropout = float(self.config.get("dropout", 0.3))
            image_size = int(self.config.get("image_size", 320))
            norm = self.config.get(
                "normalization",
                {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
            )

            # Build model
            model = EfficientNetB0(num_classes=num_classes, dropout=dropout)
            model.load_state_dict(load_file(weights_path, device=str(self.device)))
            model.to(self.device)
            model.eval()

            self.model = model

            # Define exact preprocessing pipeline required by the model
            self.transform = transforms.Compose(
                [
                    transforms.Resize((image_size, image_size)),
                    transforms.ToTensor(),
                    transforms.Normalize(norm["mean"], norm["std"]),
                ]
            )

            self.is_loaded = True
            self.load_error = None
            logger.info(
                "Successfully loaded EfficientNet-B0 (classes=%d, size=%dx%d, device=%s)",
                num_classes,
                image_size,
                image_size,
                self.device,
            )
        except Exception as exc:
            self.is_loaded = False
            self.load_error = str(exc)
            logger.error("Failed to load EfficientNet model: %s", exc, exc_info=True)
            raise RuntimeError(f"Could not load Hugging Face model {REPO_ID}: {exc}") from exc

    def preprocess_image(self, image_input: Union[bytes, Image.Image, str, Path]) -> torch.Tensor:
        """Preprocesses input image into a normalized PyTorch tensor with batch dimension."""
        if not self.is_loaded:
            self.load_model()

        if self.transform is None:
            raise RuntimeError("Image transform pipeline is not initialized")

        # Load PIL image
        if isinstance(image_input, (bytes, bytearray)):
            try:
                image = Image.open(io.BytesIO(image_input))
            except UnidentifiedImageError as err:
                raise ValueError("The provided file bytes cannot be identified as an image.") from err
        elif isinstance(image_input, (str, Path)):
            try:
                image = Image.open(image_input)
            except Exception as err:
                raise ValueError(f"Could not open image file '{image_input}': {err}") from err
        elif isinstance(image_input, Image.Image):
            image = image_input
        else:
            raise TypeError(f"Unsupported image input type: {type(image_input)}")

        # Ensure RGB 3-channel
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Apply transforms and add batch dimension
        tensor: torch.Tensor = self.transform(image).unsqueeze(0).to(self.device)
        return tensor

    def predict(
        self, image_input: Union[bytes, Image.Image, str, Path], top_k: int = 3
    ) -> Dict[str, Any]:
        """Runs real inference and returns class predictions and confidence scores."""
        if not self.is_loaded:
            self.load_model()

        if self.model is None:
            raise RuntimeError("EfficientNet model is not initialized")

        tensor = self.preprocess_image(image_input)

        with torch.inference_mode():
            logits = self.model(tensor)
            probabilities = torch.softmax(logits, dim=1)[0].cpu().tolist()

        raw_classes: List[str] = self.config.get(
            "class_names", ["MEL", "NV", "BCC", "AKIEC", "BKL", "DF", "VASC"]
        )

        # Build sorted predictions
        all_preds = []
        for code, prob in zip(raw_classes, probabilities):
            display_name = CLASS_MAPPING.get(code, code)
            all_preds.append({
                "code": code,
                "class": display_name,
                "confidence": round(float(prob), 4),
            })

        all_preds.sort(key=lambda x: x["confidence"], reverse=True)

        top_predictions = [
            {"class": item["class"], "confidence": item["confidence"]}
            for item in all_preds[:top_k]
        ]

        top_1 = all_preds[0]

        return {
            "prediction": top_1["class"],
            "confidence": top_1["confidence"],
            "top_predictions": top_predictions,
            "model": "EfficientNet-B0",
        }


# Singleton accessor
model_service = ModelService.get_instance()
