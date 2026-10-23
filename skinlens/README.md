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

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Custom healthcare design tokens: teal, emerald, slate, rose)
- **Component Pattern:** shadcn/ui-inspired clean accessible modular components
- **Icons:** Lucide React
- **Features:**
  - Dynamic Grad-CAM Visualizer (Side-by-Side, Overlay, Thermal Saliency, Opacity slider)
  - ABCDE Dermatological Criteria Breakdown
  - Real-time Optical Quality Gauge (Sharpness, Lighting, Contrast)
  - 1-Click Clinical Demo Samples (Melanoma, BCC, Benign Nevus)
  - Resilient API client with offline demo fallback

### Backend
- **Framework:** Python 3 + FastAPI
- **Computer Vision & Image Processing:** OpenCV (`opencv-python-headless`), Pillow (`PIL`), NumPy
- **Deep Learning / Tensor Infrastructure:** PyTorch (`torch`)
- **Validation & Schemas:** Pydantic v2
- **Server:** Uvicorn ASGI

---

## 📁 Project Structure

```
skinlens/
├── frontend/
│   ├── public/
│   │   └── samples/                 # Synthetic clinical demo images (Melanoma, BCC, Nevus)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Clinical header with backend status indicator
│   │   │   ├── Badge.tsx            # Medical risk and priority status badges
│   │   │   ├── Button.tsx           # Reusable accessible button variants
│   │   │   ├── Card.tsx             # Card container primitives
│   │   │   ├── GradCAMViewer.tsx    # Explainable AI visualizer (Overlay, Split, Heatmap)
│   │   │   ├── QualityIndicator.tsx # Sharpness, illumination, contrast meters
│   │   │   └── ABCDECard.tsx        # ABCDE dermatological criteria semiotics
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Metrics, pipeline overview, recent cases
│   │   │   ├── NewScreeningPage.tsx # Intake form, image dropzone, sample loaders
│   │   │   ├── ScreeningResultPage.tsx # Triage banner, Grad-CAM, differentials
│   │   │   ├── CasesPage.tsx        # Search, risk filters, case table
│   │   │   └── CaseDetailsPage.tsx  # Clinician review & attestation workflow
│   │   ├── services/
│   │   │   └── api.ts               # API service connecting to backend on port 8005
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript definitions
│   │   ├── App.tsx                  # Core app router & layout
│   │   ├── main.tsx
│   │   └── index.css                # Tailwind directives & healthcare theme
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
└── backend/
    ├── app/
    │   ├── main.py                  # FastAPI app & endpoints
    │   ├── models/
    │   │   └── schemas.py           # Pydantic data schemas
    │   ├── services/
    │   │   ├── quality_service.py   # Blur (Laplacian var), exposure & contrast checks
    │   │   ├── classification_service.py # Mock AI inference & differential diagnosis
    │   │   ├── gradcam_service.py   # Grad-CAM heatmap & blend generation
    │   │   └── case_service.py      # Case repository & review tracking
    │   └── utils/
    │       └── image_processing.py  # Image bytes, PIL, OpenCV, base64 conversions
    └── requirements.txt
```

---

## 🚀 Running the Project

Frontend and backend run **independently**.

### 1. Backend Setup & Run (FastAPI)

```bash
cd skinlens/backend

# Create virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies (FastAPI, PyTorch, OpenCV, Pillow, Uvicorn, etc.)
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8005 --reload
```

The backend will be available at:
- **API Root:** `http://127.0.0.1:8005/`
- **Swagger Interactive Docs:** `http://127.0.0.1:8005/docs`
- **Health Check:** `http://127.0.0.1:8005/api/health`

---

### 2. Frontend Setup & Run (React + Vite)

In a separate terminal:

```bash
cd skinlens/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will run at:
- **Web App:** `http://127.0.0.1:5173/`

> **Note:** The frontend automatically connects to the backend at `http://127.0.0.1:8005`. If the backend is not running, the frontend gracefully operates in interactive demo mode using pre-seeded cases.

---

## 🧪 Testing the Core MVP Flow

1. **Dashboard:**
   - Open `http://127.0.0.1:5173/`
   - Observe live dashboard metrics: *Screenings Today*, *Cases Awaiting Review*, *Review Recommended*, and *High Risk Detected*.
   - View the *Recent Cases* queue.

2. **New Screening:**
   - Click the **"New Screening"** button.
   - Click **"Melanoma Sample"**, **"BCC Sample"**, or **"Benign Nevus"** to load realistic clinical test cases with 1-click.
   - Or upload your own dermoscopic photo.
   - Click **"Run AI Screening"**.
   - Watch the multi-stage scanning animation verify optical quality, neural features, and Grad-CAM layers.

3. **Screening Result:**
   - Review the **Image Quality Check** (Sharpness %, Lighting %, Contrast %, Resolution).
   - Inspect the **Primary AI Classification** (e.g. Malignant Melanoma with 94.2% confidence).
   - Use the **Grad-CAM Saliency Visualizer**:
     - Toggle between **Overlay**, **Side-by-Side**, **Dermoscopy**, and **Heatmap** modes.
     - Adjust the **Heatmap Intensity Slider** (0% - 100%).
   - Review **Differential Diagnoses** and the **ABCDE Criteria Breakdown**.

4. **Clinician Review:**
   - Click **"Proceed to Clinician Review"**.
   - Fill in clinician notes, select **Triage Verdict** (e.g., *Agreed with AI Diagnosis* or *Flagged for Biopsy*), choose **Final Stratified Risk**, and specify **Recommended Action**.
   - Click **"Save & Certify Review"**.
   - The case status updates to **Reviewed** with a verified clinician stamp.

5. **Cases Registry:**
   - Click **"Cases & Reviews"** in the top navigation bar.
   - Filter cases by **Status** (*Awaiting Review*, *Under Review*, *Reviewed*) or **Risk Tier** (*High*, *Moderate*, *Low*).
   - Search across patient names, diagnoses, or lesion locations.

---

## 📑 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/screen` | **Core Screening Endpoint**: Complete 6-stage pipeline (Quality → Preprocessing → Real EfficientNet → Prediction → Real Grad-CAM → Response) |
| `POST` | `/api/predict` | **Direct AI Inference**: Accepts multipart image and returns model predictions, confidence, and top-3 |
| `POST` | `/api/quality-check` | **Image Quality Validation**: Prototype checks for format, resolution, blur, brightness, and contrast |
| `POST` | `/api/gradcam` | **Real Grad-CAM Explainability**: Captures layer activations & gradients, returns heatmap & overlay URLs |
| `GET` | `/results/...` | **Static Results**: Serves generated Grad-CAM heatmaps and blended overlays (`image/jpeg`) |
| `GET` | `/` | API Root & Core Pipeline description |
| `GET` | `/api/health` | Health status probe (`model_loaded: true`) |
| `GET` | `/api/stats` | Dashboard metrics |
| `GET` | `/api/cases` | List screening cases (supports `?status=`, `?risk_level=`, `?search=`) |
| `GET` | `/api/cases/{case_id}` | Retrieve individual case details |
| `POST` | `/api/cases/{case_id}/review` | Submit clinician review & attestation |
| `POST` | `/api/screenings/upload-and-analyze` | Multipart upload: image quality + AI classification + Grad-CAM generation |

---

## 🎯 Core Screening Pipeline (`POST /api/screen`)

The core of the SkinLens MVP combines optical quality assessment, genuine neural classification, and gradient-weighted class activation mapping into a single, unified endpoint:

```
IMAGE
  ↓
IMAGE QUALITY CHECK (Resolution, Blur, Brightness, Contrast, Format)
  ↓
PREPROCESSING (RGB 320x320, ImageNet Normalization, Resolution Guard)
  ↓
REAL EFFICIENTNET INFERENCE (Real PyTorch Forward Pass)
  ↓
PREDICTION + CONFIDENCE (Calibrated Softmax across 7 classes)
  ↓
REAL GRAD-CAM (Feature Activation & Gradient Backpropagation)
  ↓
SCREENING RESPONSE (Quality, Predictions, Heatmap URLs, Processing Time)
```

### Request Parameters (`multipart/form-data`)
- `image`: Skin lesion photo file (JPEG, PNG, WebP) *(Required)*
- `patient_name`: Patient full name *(Optional)*
- `age`: Patient age *(Optional)*
- `lesion_location`: Anatomical location *(Optional)*
- `duration`: Lesion duration / history *(Optional)*
- `clinical_notes`: Clinician or patient notes *(Optional)*

### Response Schema (`200 OK`)
```json
{
  "case_id": "CASE-2026-E0C9CF",
  "quality": {
    "valid": true,
    "score": 0.70
  },
  "prediction": {
    "class": "Melanoma",
    "confidence": 0.87,
    "top_predictions": [
      { "class": "Melanoma", "confidence": 0.87 },
      { "class": "VASC", "confidence": 0.08 },
      { "class": "DF", "confidence": 0.03 }
    ]
  },
  "explanation": {
    "heatmap_url": "/results/heatmap/7cde2883c9bb_heatmap.jpg",
    "overlay_url": "/results/overlay/7cde2883c9bb_overlay.jpg"
  },
  "model": {
    "architecture": "EfficientNet-B0",
    "source": "Hugging Face"
  },
  "processing_time": 0.20
}
```

### Error Handling & Safeguards
- **Missing or Empty File:** Returns `400 Bad Request` with helpful message.
- **Unsupported File Format:** Returns `400 Bad Request` if file is not an image MIME type.
- **Corrupt Image Data:** Returns `422 Unprocessable Content` if bytes cannot be decoded as an image.
- **Oversized Images:** Files exceeding 20MB return `413 Content Too Large`. Images with dimensions $> 2560\text{px}$ are safely downsampled with aspect-ratio preservation prior to inference and Grad-CAM blending.
- **Model / Grad-CAM Errors:** Caught and logged with `500 Internal Server Error` and clean diagnostic messaging.

### Testing in Swagger UI
1. Navigate to `http://127.0.0.1:8005/docs`.
2. Expand `POST /api/screen`.
3. Click **"Try it out"**.
4. Choose an image file (`skinlens/frontend/public/samples/melanoma_sample.jpg`).
5. Optionally fill out patient details.
6. Click **"Execute"**.
7. Observe real inference probabilities and copy the returned `heatmap_url` or `overlay_url` to inspect the visual explanation.

---

## 🧠 Real AI Model CLI Testing

Run real PyTorch inference on any image using the CLI utility:

```bash
cd skinlens/backend
source venv/bin/activate

# Run inference on an image
python test_model.py ../frontend/public/samples/melanoma_sample.jpg
```

Output format:
```json
{
  "prediction": "VASC",
  "confidence": 0.5139,
  "top_predictions": [
    {
      "class": "VASC",
      "confidence": 0.5139
    },
    {
      "class": "Melanoma",
      "confidence": 0.3117
    },
    {
      "class": "DF",
      "confidence": 0.0914
    }
  ],
  "model": "EfficientNet-B0"
}
```

---

## 🔒 Scope & Ideathon Architecture Boundaries

- Real Hugging Face fine-tuned EfficientNet-B0 model integrated for genuine neural classification.
- Lightweight, self-contained, and ready for rapid presentation and demonstration without heavy microservices.
