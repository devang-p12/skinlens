from datetime import datetime, timezone
from typing import List, Optional, Dict
import copy
import uuid

from ..models.schemas import (
    ScreeningCase,
    ClinicianReview,
    ClinicianReviewSubmission,
    DashboardStats,
    ImageQualityResult,
    ImageResolution,
    DiagnosisItem,
    ABCDEAssessment,
    GradCAMExplanation
)

class CaseService:
    """In-memory case repository seeded with realistic clinical cases for the MVP."""
    
    _cases: Dict[str, ScreeningCase] = {}
    _seeded: bool = False

    @classmethod
    def _seed_initial_cases(cls):
        if cls._seeded:
            return
        cls._seeded = True

        mock_data = [
            {
                "case_id": "CASE-2026-8904",
                "patient_id": "PT-7192",
                "patient_name": "David Ross",
                "patient_age": 48,
                "lesion_location": "Left Shoulder (Posterior)",
                "duration": "2-3 months",
                "clinical_notes": "Asymmetric pigmented macule with irregular borders; patient noticed slight enlargement and color darkening.",
                "symptoms": ["Recent growth", "Color asymmetry", "Irregular border"],
                "quality": ImageQualityResult(
                    is_acceptable=True,
                    quality_rating="Optimal",
                    sharpness_score=93.5,
                    lighting_score=89.2,
                    contrast_score=86.4,
                    resolution=ImageResolution(width=1024, height=1024),
                    issues=[],
                    recommendations=["Image quality optimal for screening review."]
                ),
                "primary_diagnosis": "Melanoma",
                "condition_code": "MEL",
                "confidence": 0.872,
                "malignancy_risk": "High",
                "triage_priority": "Urgent",
                "screening_priority": "Review Recommended",
                "triage_reason": "This is an AI-assisted screening signal intended to support professional review.",
                "differential_diagnoses": [
                    DiagnosisItem(
                        condition_code="MEL",
                        name="Melanoma",
                        confidence=0.872,
                        risk_level="High",
                        description="Melanocytic lesion with atypical architectural features.",
                        clinical_action="Professional clinician review and evaluation recommended."
                    ),
                    DiagnosisItem(
                        condition_code="NV",
                        name="Dysplastic Nevus",
                        confidence=0.088,
                        risk_level="Moderate",
                        description="Atypical melanocytic nevus.",
                        clinical_action="Dermoscopic follow-up."
                    ),
                ],
                "abcde": ABCDEAssessment(
                    asymmetry={"score": 0.87, "label": "Elevated Asymmetry", "detail": "Significant geometric imbalance across vertical axis."},
                    border={"score": 0.84, "label": "Notched / Scalloped", "detail": "Abrupt pigment cutoff with peripheral scalloping."},
                    color={"score": 0.89, "label": "Variegated Pigment", "detail": "Variegated pigmentation containing black and dark brown regions."},
                    diameter={"score": 0.72, "label": "> 6.0 mm", "detail": "Estimated lesion dimension exceeds safe clinical margin."},
                    evolution={"score": 0.86, "label": "Recent Change", "detail": "Documented progression in size and appearance over 90 days."},
                    total_suspicion_score=0.87
                ),
                "gradcam": GradCAMExplanation(
                    heatmap_data_url="",
                    blended_data_url="",
                    original_data_url="",
                    explanation_summary="Deep Grad-CAM attention focus detected over asymmetric peripheral margin and atypical pigment network.",
                    salient_regions=["Peripheral border scalloping", "Central atypical pigment concentration"],
                    focal_intensity=0.87
                ),
                "status": "Awaiting Review",
                "clinician_review": None,
                "created_at": "2026-10-23T10:15:00Z",
                "updated_at": "2026-10-23T10:15:00Z",
            },
            {
                "case_id": "CASE-2026-8901",
                "patient_id": "PT-4421",
                "patient_name": "Eleanor Vance",
                "patient_age": 54,
                "lesion_location": "Upper Back (Interscapular)",
                "duration": "3-6 months",
                "clinical_notes": "Patient noticed new dark mole with notched borders that occasionally bleeds during showering.",
                "symptoms": ["Bleeding", "Irregular borders", "Recent rapid change", "Dark coloration"],
                "quality": ImageQualityResult(
                    is_acceptable=True,
                    quality_rating="Optimal",
                    sharpness_score=92.4,
                    lighting_score=88.1,
                    contrast_score=85.6,
                    resolution=ImageResolution(width=1024, height=768),
                    issues=[],
                    recommendations=["High-fidelity dermoscopic acquisition."]
                ),
                "primary_diagnosis": "Malignant Melanoma",
                "condition_code": "MEL",
                "confidence": 0.942,
                "malignancy_risk": "High",
                "triage_priority": "Urgent",
                "triage_reason": "Deep pigment asymmetry and border notch activation. Rapid excision triage indicated.",
                "differential_diagnoses": [
                    DiagnosisItem(
                        condition_code="MEL",
                        name="Malignant Melanoma",
                        confidence=0.942,
                        risk_level="High",
                        description="Aggressive melanocytic malignancy requiring immediate full-thickness wide excision.",
                        clinical_action="Urgent specialist referral within 48 hours for diagnostic biopsy."
                    ),
                    DiagnosisItem(
                        condition_code="BCC",
                        name="Basal Cell Carcinoma",
                        confidence=0.038,
                        risk_level="Moderate",
                        description="Pigmented variant of basal cell carcinoma.",
                        clinical_action="Surgical excision."
                    ),
                    DiagnosisItem(
                        condition_code="AKIEC",
                        name="Actinic Keratosis",
                        confidence=0.020,
                        risk_level="Moderate",
                        description="Dysplastic epidermal change.",
                        clinical_action="Routine follow-up."
                    )
                ],
                "abcde": ABCDEAssessment(
                    asymmetry={"score": 0.92, "label": "Severe Asymmetry", "detail": "Major axes do not mirror in shape or pigment."},
                    border={"score": 0.88, "label": "Notched & Irregular", "detail": "Scalloped margins with abrupt termination."},
                    color={"score": 0.94, "label": "Variegated (3+ shades)", "detail": "Dark brown, jet black, and peripheral hypopigmented areas."},
                    diameter={"score": 0.85, "label": "> 8.5 mm", "detail": "Significantly exceeds the 6mm warning threshold."},
                    evolution={"score": 0.95, "label": "Rapidly Evolving", "detail": "Patient reports enlargement and bleeding over past 90 days."},
                    total_suspicion_score=0.91
                ),
                "gradcam": GradCAMExplanation(
                    heatmap_data_url="",
                    blended_data_url="",
                    original_data_url="",
                    explanation_summary="Deep neural activation (94.2%) centered along the superior-lateral notched margin and atypical pigment network.",
                    salient_regions=[
                        "Superior border scalloping",
                        "Eccentric hyperpigmented globule cluster",
                        "Peripheral pigment cutoff"
                    ],
                    focal_intensity=0.94
                ),
                "status": "Awaiting Review",
                "clinician_review": None,
                "created_at": "2026-10-19T08:15:00Z",
                "updated_at": "2026-10-19T08:15:00Z"
            },
            {
                "case_id": "CASE-2026-8902",
                "patient_id": "PT-3108",
                "patient_name": "Marcus Chen",
                "patient_age": 62,
                "lesion_location": "Right Malar Cheek",
                "duration": "> 1 year",
                "clinical_notes": "Slow-growing pearly papule with fine prominent capillaries over sun-damaged facial skin.",
                "symptoms": ["Pearly translucent papule", "Telangiectasia", "Sun-exposed region"],
                "quality": ImageQualityResult(
                    is_acceptable=True,
                    quality_rating="Optimal",
                    sharpness_score=87.5,
                    lighting_score=89.0,
                    contrast_score=78.2,
                    resolution=ImageResolution(width=1024, height=1024),
                    issues=[],
                    recommendations=["Clear view of arborizing microvessels."]
                ),
                "primary_diagnosis": "Basal Cell Carcinoma",
                "condition_code": "BCC",
                "confidence": 0.887,
                "malignancy_risk": "Moderate",
                "triage_priority": "Moderate",
                "triage_reason": "Classic arborizing telangiectasia and rolled pearly border on right malar cheek.",
                "differential_diagnoses": [
                    DiagnosisItem(
                        condition_code="BCC",
                        name="Basal Cell Carcinoma",
                        confidence=0.887,
                        risk_level="Moderate",
                        description="Nodular basal cell carcinoma on facial cosmetically sensitive zone.",
                        clinical_action="Mohs micrographic surgery evaluation indicated."
                    ),
                    DiagnosisItem(
                        condition_code="SCC",
                        name="Squamous Cell Carcinoma",
                        confidence=0.075,
                        risk_level="High",
                        description="Invasive keratinocyte carcinoma.",
                        clinical_action="Diagnostic punch biopsy."
                    ),
                    DiagnosisItem(
                        condition_code="BKL",
                        name="Seborrheic Keratosis",
                        confidence=0.038,
                        risk_level="Low",
                        description="Benign epidermal neoplasm.",
                        clinical_action="Clinical correlation."
                    )
                ],
                "abcde": ABCDEAssessment(
                    asymmetry={"score": 0.65, "label": "Moderate Asymmetry", "detail": "Elevated pearly nodule with eccentric vascular arborization."},
                    border={"score": 0.72, "label": "Rolled Translucent Border", "detail": "Pearly edge with fine branching telangiectasias."},
                    color={"score": 0.50, "label": "Pearly Pink / Flesh", "detail": "Translucent pinkish flesh tone with micro-hemorrhage dots."},
                    diameter={"score": 0.60, "label": "6.2 mm", "detail": "Discrete focal nodule on facial surface."},
                    evolution={"score": 0.70, "label": "Indolent Growth", "detail": "Gradual progression over 12 months with occasional crusting."},
                    total_suspicion_score=0.63
                ),
                "gradcam": GradCAMExplanation(
                    heatmap_data_url="",
                    blended_data_url="",
                    original_data_url="",
                    explanation_summary="Grad-CAM demonstrates dense focus over branching micro-vascular arborization and rolled rim.",
                    salient_regions=[
                        "Arborizing telangiectatic vessels",
                        "Rolled pearly peripheral edge",
                        "Micro-ulcerative core"
                    ],
                    focal_intensity=0.89
                ),
                "status": "Under Review",
                "clinician_review": None,
                "created_at": "2026-10-19T07:42:00Z",
                "updated_at": "2026-10-19T08:30:00Z"
            },
            {
                "case_id": "CASE-2026-8903",
                "patient_id": "PT-5590",
                "patient_name": "Aria Patel",
                "patient_age": 29,
                "lesion_location": "Left Forearm (Volar)",
                "duration": "> 2 years",
                "clinical_notes": "Uniform brown macule, unchanged since adolescence, requested baseline screening check.",
                "symptoms": ["Stable lesion", "Symmetric"],
                "quality": ImageQualityResult(
                    is_acceptable=True,
                    quality_rating="Good",
                    sharpness_score=94.1,
                    lighting_score=91.4,
                    contrast_score=82.0,
                    resolution=ImageResolution(width=800, height=800),
                    issues=[],
                    recommendations=["Clear reticular pigment network visualization."]
                ),
                "primary_diagnosis": "Benign Melanocytic Nevus",
                "condition_code": "NV",
                "confidence": 0.958,
                "malignancy_risk": "Low",
                "triage_priority": "Routine",
                "triage_reason": "Homogenous benign reticular network with symmetric round contours and stable history.",
                "differential_diagnoses": [
                    DiagnosisItem(
                        condition_code="NV",
                        name="Benign Melanocytic Nevus",
                        confidence=0.958,
                        risk_level="Low",
                        description="Uniform melanocytic junctional nevus with benign dermoscopic architecture.",
                        clinical_action="Routine reassurance. Annual skin self-check."
                    ),
                    DiagnosisItem(
                        condition_code="BKL",
                        name="Benign Keratosis",
                        confidence=0.032,
                        risk_level="Low",
                        description="Early macular seborrheic keratosis.",
                        clinical_action="Reassurance."
                    ),
                    DiagnosisItem(
                        condition_code="MEL",
                        name="Melanoma (Atypical)",
                        confidence=0.010,
                        risk_level="High",
                        description="Extremely low probability atypical variant.",
                        clinical_action="Monitor for changes."
                    )
                ],
                "abcde": ABCDEAssessment(
                    asymmetry={"score": 0.12, "label": "Symmetric", "detail": "Perfect circular-oval bilateral mirror symmetry."},
                    border={"score": 0.15, "label": "Sharp & Circumscribed", "detail": "Smooth borders with gradual fading periphery."},
                    color={"score": 0.18, "label": "Monotone Uniform Tan", "detail": "Single consistent golden-brown pigmentation throughout."},
                    diameter={"score": 0.35, "label": "4.2 mm", "detail": "Well below the 6.0 mm threshold."},
                    evolution={"score": 0.05, "label": "Completely Stable", "detail": "No reported size, elevation, or symptomatic changes."},
                    total_suspicion_score=0.17
                ),
                "gradcam": GradCAMExplanation(
                    heatmap_data_url="",
                    blended_data_url="",
                    original_data_url="",
                    explanation_summary="Grad-CAM demonstrates uniform diffuse attention across regular pigment grid without peripheral focal spikes.",
                    salient_regions=[
                        "Centrally balanced pigment network",
                        "Symmetric circular perimeter"
                    ],
                    focal_intensity=0.96
                ),
                "status": "Reviewed",
                "clinician_review": ClinicianReview(
                    reviewer_name="Dr. Julian Vance, MD, FAAD",
                    reviewer_role="Board Certified Dermatologist",
                    review_notes="Concur completely with AI assessment. Classical benign compound melanocytic nevus. Patient reassured.",
                    triage_verdict="Discharged (Benign)",
                    final_risk_level="Low",
                    action_taken="Patient reassured, self-monitoring guidance provided.",
                    reviewed_at="2026-10-19T09:10:00Z"
                ),
                "created_at": "2026-10-19T06:50:00Z",
                "updated_at": "2026-10-19T09:10:00Z"
            },
            {
                "case_id": "CASE-2026-8904",
                "patient_id": "PT-7712",
                "patient_name": "Samuel Morales",
                "patient_age": 71,
                "lesion_location": "Scalp (Vertex)",
                "duration": "1-3 months",
                "clinical_notes": "Scaly, hyperkeratotic erythematous plaque on chronically sun-exposed thinning scalp.",
                "symptoms": ["Scaly plaque", "Rough texture", "Sun exposure history"],
                "quality": ImageQualityResult(
                    is_acceptable=True,
                    quality_rating="Good",
                    sharpness_score=81.2,
                    lighting_score=76.8,
                    contrast_score=79.4,
                    resolution=ImageResolution(width=900, height=900),
                    issues=[],
                    recommendations=["Adequate visibility of keratotic scale."]
                ),
                "primary_diagnosis": "Actinic Keratosis",
                "condition_code": "AKIEC",
                "confidence": 0.835,
                "malignancy_risk": "Moderate",
                "triage_priority": "Moderate",
                "triage_reason": "Erythematous background with prominent follicular plug keratosis; precancerous potential.",
                "differential_diagnoses": [
                    DiagnosisItem(
                        condition_code="AKIEC",
                        name="Actinic Keratosis",
                        confidence=0.835,
                        risk_level="Moderate",
                        description="Pre-cancerous keratinocyte dysplasia on sun-damaged scalp.",
                        clinical_action="Liquid nitrogen cryotherapy or field topical therapy."
                    ),
                    DiagnosisItem(
                        condition_code="SCC",
                        name="Squamous Cell Carcinoma",
                        confidence=0.125,
                        risk_level="High",
                        description="Early micro-invasive squamous cell carcinoma.",
                        clinical_action="Shave biopsy if induration persists."
                    ),
                    DiagnosisItem(
                        condition_code="BKL",
                        name="Seborrheic Keratosis",
                        confidence=0.040,
                        risk_level="Low",
                        description="Irritated benign keratosis.",
                        clinical_action="Clinical monitoring."
                    )
                ],
                "abcde": ABCDEAssessment(
                    asymmetry={"score": 0.55, "label": "Mild Asymmetry", "detail": "Irregular erythema margins over actinic base."},
                    border={"score": 0.60, "label": "Poorly Demarcated", "detail": "Fades into adjacent actinic field change."},
                    color={"score": 0.65, "label": "Erythematous / White Scale", "detail": "Pink background with coarse hyperkeratotic scale."},
                    diameter={"score": 0.75, "label": "7.5 mm", "detail": "Broad keratotic patch."},
                    evolution={"score": 0.60, "label": "Recurrent Crust", "detail": "Patient picks scaly surface which re-accumulates."},
                    total_suspicion_score=0.63
                ),
                "gradcam": GradCAMExplanation(
                    heatmap_data_url="",
                    blended_data_url="",
                    original_data_url="",
                    explanation_summary="Activation highlights hyperkeratotic follicular plugs and erythematous base.",
                    salient_regions=[
                        "Central hyperkeratotic scale",
                        "Follicular keratotic plugging",
                        "Perilesional erythematous halo"
                    ],
                    focal_intensity=0.84
                ),
                "status": "Awaiting Review",
                "clinician_review": None,
                "created_at": "2026-10-19T06:15:00Z",
                "updated_at": "2026-10-19T06:15:00Z"
            }
        ]

        for item in mock_data:
            case = ScreeningCase(**item)
            cls._cases[case.case_id] = case

    @classmethod
    def list_cases(
        cls,
        status: Optional[str] = None,
        risk_level: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[ScreeningCase]:
        cls._seed_initial_cases()
        results = list(cls._cases.values())

        if status:
            results = [c for c in results if c.status.lower() == status.lower()]
        
        if risk_level:
            results = [c for c in results if c.malignancy_risk.lower() == risk_level.lower()]
            
        if search:
            q = search.lower()
            results = [
                c for c in results
                if q in c.patient_name.lower()
                or q in c.case_id.lower()
                or q in c.patient_id.lower()
                or q in c.primary_diagnosis.lower()
                or q in c.lesion_location.lower()
            ]

        # Sort newest first
        results.sort(key=lambda x: x.created_at, reverse=True)
        return results

    @classmethod
    def get_case(cls, case_id: str) -> Optional[ScreeningCase]:
        cls._seed_initial_cases()
        return cls._cases.get(case_id)

    @classmethod
    def save_case(cls, case: ScreeningCase) -> ScreeningCase:
        cls._seed_initial_cases()
        cls._cases[case.case_id] = case
        return case

    @classmethod
    def delete_case(cls, case_id: str) -> bool:
        cls._seed_initial_cases()
        if case_id in cls._cases:
            del cls._cases[case_id]
            return True
        return False

    @classmethod
    def clear_all_cases(cls) -> None:
        cls._cases.clear()

    @classmethod
    def reset_demo_cases(cls) -> List[ScreeningCase]:
        cls._cases.clear()
        cls._seeded = False
        cls._seed_initial_cases()
        return list(cls._cases.values())

    @classmethod
    def submit_review(
        cls,
        case_id: str,
        review_data: ClinicianReviewSubmission
    ) -> Optional[ScreeningCase]:
        cls._seed_initial_cases()
        case = cls._cases.get(case_id)
        if not case:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        action_type = review_data.action_type or "reviewed"
        
        review = ClinicianReview(
            reviewer_name=review_data.reviewer_name,
            reviewer_role=review_data.reviewer_role or "Attending Clinician",
            review_notes=review_data.review_notes,
            triage_verdict=review_data.triage_verdict,
            final_risk_level=review_data.final_risk_level,
            action_taken=review_data.action_taken,
            reviewed_at=now_iso,
            action_type=action_type,
        )

        case.clinician_review = review
        if action_type == "referred":
            case.status = "Awaiting Specialist Review"
            case.referral = {
                "referral_id": f"REF-{case_id.replace('CASE-', '')}",
                "case_id": case_id,
                "priority": getattr(case, "screening_priority", "Review Recommended"),
                "status": "Awaiting Specialist Review",
                "referred_at": now_iso,
                "clinician_notes": review_data.review_notes,
            }
        elif action_type == "retake_requested":
            case.status = "Better Image Requested"
        else:
            case.status = "Reviewed"

        case.malignancy_risk = review_data.final_risk_level
        case.updated_at = now_iso
        
        cls._cases[case_id] = case
        return case

    @classmethod
    def get_stats(cls) -> DashboardStats:
        cls._seed_initial_cases()
        all_cases = list(cls._cases.values())
        
        awaiting_review = sum(1 for c in all_cases if c.status in ["Awaiting Review", "Under Review"])
        review_rec = sum(1 for c in all_cases if c.triage_priority in ["Urgent", "Moderate"])
        high_risk = sum(1 for c in all_cases if c.malignancy_risk == "High")
        total = len(all_cases)
        # Mock screenings today: active cases created today + recent count
        today_count = total + 3

        return DashboardStats(
            screenings_today=today_count,
            cases_awaiting_review=awaiting_review,
            review_recommended=review_rec,
            high_risk_detected=high_risk,
            total_screenings=total
        )
