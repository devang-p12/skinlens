#!/usr/bin/env python3
"""CLI utility to test real inference, image quality check, and real Grad-CAM using the
fine-tuned EfficientNet-B0 skin-lesion model.

Usage:
    python test_model.py <path_to_image> [--gradcam] [--quality]

Examples:
    python test_model.py ../frontend/public/samples/melanoma_sample.jpg
    python test_model.py ../frontend/public/samples/melanoma_sample.jpg --gradcam
"""

import sys
import json
from pathlib import Path

# Add backend directory to path so app package imports work
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

try:
    from app.services.model_service import model_service
    from app.services.image_quality import validate_image_quality
    from app.services.gradcam_service import get_gradcam_service
except ImportError as err:
    print(f"Error importing services: {err}")
    sys.exit(1)


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print("Usage: python test_model.py <image_path> [--gradcam] [--quality]")
        print("Example: python test_model.py ../frontend/public/samples/melanoma_sample.jpg --gradcam")
        sys.exit(1)

    image_path = Path(sys.argv[1])
    if not image_path.exists():
        print(f"Error: Image file '{image_path}' does not exist.")
        sys.exit(1)

    run_gradcam = "--gradcam" in sys.argv
    run_quality = "--quality" in sys.argv

    # 1. Quality Validation Check
    quality_result = validate_image_quality(image_path)
    if run_quality:
        print("\n================ Image Quality Validation ================")
        print(json.dumps(quality_result, indent=2))
        print("==========================================================")

    # 2. Real Inference
    print(f"\nEvaluating image with real EfficientNet-B0: {image_path}...")
    try:
        model_service.load_model()
        result = model_service.predict(image_path, top_k=3)
    except Exception as exc:
        print(f"Inference error: {exc}")
        sys.exit(1)

    print("\n================ Real Inference Result ================")
    print(json.dumps(result, indent=2))
    print("=======================================================\n")
    print(f"Top Prediction : {result['prediction']}")
    print(f"Confidence     : {result['confidence']:.4f} ({(result['confidence'] * 100):.2f}%)")
    print("Top Predictions:")
    for idx, item in enumerate(result["top_predictions"], 1):
        print(f"  {idx}. {item['class']:<15} : {item['confidence']:.4f}")
    print(f"Model          : {result['model']}")

    # 3. Real Grad-CAM Generation if requested
    if run_gradcam:
        print("\nComputing real Grad-CAM layer-4 activations and gradients...")
        try:
            gradcam_engine = get_gradcam_service()
            gradcam_res = gradcam_engine.generate(image_path)
            print("\n================ Real Grad-CAM Result =================")
            print(json.dumps(gradcam_res, indent=2))
            print("=======================================================")
            print(f"Heatmap file URL : {gradcam_res['heatmap_url']}")
            print(f"Overlay file URL : {gradcam_res['overlay_url']}")
            print(f"Notice           : {gradcam_res['disclaimer']}")
        except Exception as exc:
            print(f"Grad-CAM generation error: {exc}")


if __name__ == "__main__":
    main()
