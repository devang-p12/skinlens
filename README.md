# SkinLens — Explainable AI-Powered Skin Lesion Screening Platform

**SkinLens** is a clinical ideathon MVP designed to assist dermatologists, general practitioners, and triage nurses with AI-assisted skin lesion screening, optical quality validation, calibrated confidence scoring, **Grad-CAM visual interpretability**, and clinician attestation workflows.

---

## 🔬 Core MVP Flow

```
Upload Skin Lesion Image
        ↓
Image Quality Check (Laplacian Blur, Illumination & Contrast)
        ↓
AI Skin-Lesion Classification & Differentials
        ↓
Confidence Score Meter (%)
        ↓
Grad-CAM Explainable AI Heatmap & Saliency Layer
        ↓
Screening Triage Priority (Urgent / Moderate / Routine)
        ↓
Clinician Review & Diagnostic Attestation
```

---

## 📁 Project Structure

```
skinlens/
├── frontend/                        # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── public/
│   │   └── samples/                 # Synthetic clinical demo images (Melanoma, BCC, Nevus)
│   ├── src/
│   │   ├── components/              # Badges, Buttons, Cards, GradCAMViewer, QualityIndicator, ABCDECard
│   │   ├── pages/                   # Dashboard, New Screening, Screening Result, Cases, Case Details
│   │   ├── services/api.ts          # API client connecting to FastAPI backend
│   │   └── types/index.ts           # TypeScript interfaces
└── backend/                         # Python + FastAPI + PyTorch + OpenCV + Pillow
    ├── app/
    │   ├── main.py                  # Endpoints (upload-and-analyze, cases, review, stats)
    │   ├── models/schemas.py        # Pydantic models
    │   ├── services/                # quality_service, classification_service, gradcam_service, case_service
    │   └── utils/image_processing.py# OpenCV/PIL image utilities
    └── requirements.txt
```

---

## 🚀 Quick Start Instructions

Both Frontend and Backend run independently.

### 1. Run Backend (FastAPI)
```bash
cd skinlens/backend

# Virtual environment setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
```
- API Docs: `http://127.0.0.1:8005/docs`
- Health Check: `http://127.0.0.1:8005/api/health`
- Core Screening Pipeline: `POST http://127.0.0.1:8005/api/screen` (Complete 6-stage pipeline)
- Real Model Prediction: `POST http://127.0.0.1:8005/api/predict` (multipart `image`)
- Image Quality Check: `POST http://127.0.0.1:8005/api/quality-check` (multipart `image`)
- Real Grad-CAM Generation: `POST http://127.0.0.1:8005/api/gradcam` (multipart `image`)
- Static Grad-CAM Results: `http://127.0.0.1:8005/results/...`

### 2. Run CLI Real Model Inference & Grad-CAM
```bash
cd skinlens/backend
python test_model.py ../frontend/public/samples/melanoma_sample.jpg --gradcam --quality
```

### 2. Run Frontend (React + Vite)

In a separate terminal:
```bash
cd skinlens/frontend

npm install
npm run dev
```
- Web Application: `http://127.0.0.1:5173/`

---

## 🖥️ Frontend Pages Implemented

1. **Dashboard:**
   - SkinLens Branding
   - "New Screening" Primary Call to Action
   - Metric Cards: *Screenings Today*, *Cases Awaiting Review*, *Review Recommended*, *High Risk Detected*
   - Core MVP Pipeline Stepper
   - Recent Cases interactive table
2. **New Screening:**
   - Patient demographics (Name, Age)
   - Lesion anatomical location & quick presets
   - Duration selector
   - Reported symptoms checklist
   - Clinical notes textarea
   - Image upload dropzone with real-time preview
   - 1-Click Clinical Demo Samples (Melanoma, BCC, Benign Nevus)
   - Multi-stage scanning AI progress animation
3. **Screening Result:**
   - Triage alert banner with risk categorization
   - Primary AI classification with calibrated confidence meter
   - Image Optical Quality assessment (Sharpness, Illumination, Contrast)
   - Grad-CAM Explainable AI Visualizer (Overlay, Side-by-Side, Heatmap, Opacity slider)
   - Differential diagnoses probability spectrum
   - ABCDE clinical criteria breakdown
   - "Proceed to Clinician Review" hand-off
4. **Cases:**
   - Case registry with search by patient name, ID, location, or diagnosis
   - Filter chips for status (*Awaiting Review*, *Under Review*, *Reviewed*) and risk (*High*, *Moderate*, *Low*)
   - Quick navigation into individual case profiles
5. **Case Details:**
   - Patient demographic and history card
   - AI diagnosis and Grad-CAM interpretability visualization
   - Interactive Clinician Review form (Reviewer name, role, review notes, triage verdict, final risk override, recommended action)
   - Live certification stamp upon submission
   - Printable clinical referral slip
# skinlens
