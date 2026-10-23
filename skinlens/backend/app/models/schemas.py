from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ImageResolution(BaseModel):
    width: int
    height: int

class ImageQualityResult(BaseModel):
    is_acceptable: bool = True
    quality_rating: str = "Good"  # "Optimal", "Good", "Sub-optimal", "Unacceptable"
    sharpness_score: float = Field(..., ge=0, le=100)
    lighting_score: float = Field(..., ge=0, le=100)
    contrast_score: float = Field(..., ge=0, le=100)
    resolution: ImageResolution
    issues: List[str] = []
    recommendations: List[str] = []

class DiagnosisItem(BaseModel):
    condition_code: str
    name: str
    confidence: float = Field(..., ge=0, le=1.0)
    risk_level: str  # "High", "Moderate", "Low"
    description: str
    clinical_action: str

class TopPredictionItem(BaseModel):
    class_: str = Field(..., alias="class")
    confidence: float

    model_config = {
        "populate_by_name": True,
        "serialize_by_alias": True
    }

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    top_predictions: List[TopPredictionItem]
    model: str = "EfficientNet-B0"

class QualityChecks(BaseModel):
    resolution: bool
    blur: bool
    brightness: bool
    format: bool

class ImageQualityResponse(BaseModel):
    valid: bool
    quality_score: float
    checks: QualityChecks
    message: Optional[str] = None
    disclaimer: str = "This quality assessment is a prototype-level heuristic and is NOT clinically validated."

class GradCAMResponse(BaseModel):
    heatmap_url: str
    overlay_url: str
    predicted_class: Optional[str] = None
    confidence: Optional[float] = None
    disclaimer: str = "Grad-CAM is an interpretability aid and does not prove clinical correctness."

class QualitySummary(BaseModel):
    valid: bool
    score: float

class PredictionSummary(BaseModel):
    class_: str = Field(..., serialization_alias="class", alias="class")
    confidence: float
    top_predictions: List[TopPredictionItem]

    model_config = {
        "populate_by_name": True,
        "serialize_by_alias": True
    }

class ExplanationSummary(BaseModel):
    heatmap_url: str
    overlay_url: str

class ModelSummary(BaseModel):
    architecture: str = "EfficientNet-B0"
    source: str = "Hugging Face"

class ScreeningResponse(BaseModel):
    case_id: str
    quality: QualitySummary
    prediction: PredictionSummary
    explanation: ExplanationSummary
    model: ModelSummary
    processing_time: float

class ABCDEAssessment(BaseModel):
    asymmetry: Dict[str, Any]
    border: Dict[str, Any]
    color: Dict[str, Any]
    diameter: Dict[str, Any]
    evolution: Dict[str, Any]
    total_suspicion_score: float

class GradCAMExplanation(BaseModel):
    heatmap_data_url: str
    blended_data_url: str
    original_data_url: str
    explanation_summary: str
    salient_regions: List[str] = []
    focal_intensity: float = 0.85

class ClinicianReview(BaseModel):
    reviewer_name: str
    reviewer_role: str = "Dermatologist / Primary Care Clinician"
    review_notes: str
    triage_verdict: str
    final_risk_level: str  # "High", "Moderate", "Low"
    action_taken: str
    reviewed_at: str
    action_type: Optional[str] = "reviewed"

class ClinicianReviewSubmission(BaseModel):
    reviewer_name: str
    reviewer_role: Optional[str] = "Attending Clinician"
    review_notes: str
    triage_verdict: str
    final_risk_level: str
    action_taken: str
    action_type: Optional[str] = "reviewed"

class ScreeningCase(BaseModel):
    case_id: str
    patient_id: str
    patient_name: str
    patient_age: int
    lesion_location: str
    duration: str
    clinical_notes: Optional[str] = ""
    symptoms: List[str] = []
    
    # AI Pipeline Output
    quality: ImageQualityResult
    primary_diagnosis: str
    condition_code: str
    confidence: float
    malignancy_risk: str  # "High", "Moderate", "Low"
    triage_priority: str  # "Urgent", "Moderate", "Routine"
    screening_priority: Optional[str] = "Review Recommended"
    triage_reason: str
    differential_diagnoses: List[DiagnosisItem]
    abcde: ABCDEAssessment
    gradcam: GradCAMExplanation
    
    # Decision-Support Workflow
    status: str = "Awaiting Review"  # "Awaiting Review", "Reviewed", "Awaiting Specialist Review", "Better Image Requested"
    clinician_review: Optional[ClinicianReview] = None
    referral: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None
    created_at: str
    updated_at: str

class DashboardStats(BaseModel):
    screenings_today: int
    cases_awaiting_review: int
    review_recommended: int
    high_risk_detected: int
    total_screenings: int
