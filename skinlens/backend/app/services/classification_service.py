import random
from typing import List, Dict, Any, Optional

from ..models.schemas import DiagnosisItem, ABCDEAssessment

class ClassificationService:
    """
    Mock AI Skin Lesion Classification Service designed for the SkinLens Ideathon MVP.
    Provides structured clinical outputs, calibrated differential diagnosis probabilities,
    ABCDE dermatological scoring, and screening triage priority.
    """

    KNOWN_CONDITIONS = {
        "MEL": {
            "name": "Malignant Melanoma",
            "risk_level": "High",
            "triage_priority": "Urgent",
            "description": "High-risk aggressive melanocytic malignancy characterized by cellular atypia and uncontrolled proliferation.",
            "clinical_action": "Urgent in-person dermatologist evaluation and prompt full-thickness excisional biopsy.",
        },
        "BCC": {
            "name": "Basal Cell Carcinoma",
            "risk_level": "Moderate",
            "triage_priority": "Moderate",
            "description": "Common non-melanoma skin cancer arising from epidermal basal cells, slow-growing with local tissue destruction.",
            "clinical_action": "Surgical excision or Mohs micrographic surgery recommended within 2-4 weeks.",
        },
        "SCC": {
            "name": "Squamous Cell Carcinoma",
            "risk_level": "High",
            "triage_priority": "Urgent",
            "description": "Invasive keratinocyte malignancy with metastatic potential, frequently arising on sun-exposed skin.",
            "clinical_action": "Expedited biopsy and surgical margins assessment.",
        },
        "AKIEC": {
            "name": "Actinic Keratosis / Intraepithelial Carcinoma",
            "risk_level": "Moderate",
            "triage_priority": "Moderate",
            "description": "Premalignant dysplastic epidermal lesion caused by ultraviolet radiation, precursor to SCC.",
            "clinical_action": "Cryotherapy, topical 5-FU, or photodynamic therapy recommended.",
        },
        "NV": {
            "name": "Benign Melanocytic Nevus",
            "risk_level": "Low",
            "triage_priority": "Routine",
            "description": "Common benign proliferation of melanocytes with uniform, organized architecture.",
            "clinical_action": "Routine observation. Advise patient on standard sun protection and self-monitoring.",
        },
        "BKL": {
            "name": "Benign Keratosis (Seborrheic Keratosis)",
            "risk_level": "Low",
            "triage_priority": "Routine",
            "description": "Harmless epidermal tumor presenting as a well-demarcated stuck-on warty plaque.",
            "clinical_action": "Reassurance provided. Treatment optional only if mechanically irritated.",
        },
        "DF": {
            "name": "Dermatofibroma",
            "risk_level": "Low",
            "triage_priority": "Routine",
            "description": "Benign fibrous histiocytoma exhibiting positive clinical dimple sign on pinch.",
            "clinical_action": "Benign lesion; no invasive intervention required.",
        },
        "VASC": {
            "name": "Vascular Lesion (Cherry Angioma)",
            "risk_level": "Low",
            "triage_priority": "Routine",
            "description": "Benign capillary proliferation with characteristic lacunar dermoscopic pattern.",
            "clinical_action": "Benign vascular malformation. No active oncology intervention indicated.",
        }
    }

    @classmethod
    def classify(
        cls,
        patient_age: int,
        lesion_location: str,
        duration: str,
        clinical_notes: Optional[str] = "",
        symptoms: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Simulates AI inference by factoring in patient symptoms, duration, and clinical risk flags.
        Produces deterministic yet realistic dermatological triage results.
        """
        symptoms = symptoms or []
        notes_lower = (clinical_notes or "").lower()
        
        # High risk flags
        has_bleeding = any("bleed" in s.lower() for s in symptoms) or "bleed" in notes_lower
        has_rapid_evolution = any("recent rapid change" in s.lower() for s in symptoms) or "rapid" in duration.lower() or "recent" in duration.lower()
        has_color_variegation = any("color" in s.lower() for s in symptoms)
        has_irregular_borders = any("border" in s.lower() for s in symptoms)
        has_asymmetry = any("asymmetry" in s.lower() for s in symptoms)

        # Decide primary diagnosis based on risk features
        if has_bleeding and has_rapid_evolution:
            primary_code = "MEL"
            confidence = round(random.uniform(0.91, 0.96), 3)
        elif has_rapid_evolution or (has_irregular_borders and has_color_variegation):
            primary_code = "MEL" if patient_age > 35 else "BCC"
            confidence = round(random.uniform(0.86, 0.93), 3)
        elif has_asymmetry or has_irregular_borders:
            primary_code = "BCC"
            confidence = round(random.uniform(0.82, 0.89), 3)
        elif "crust" in notes_lower or "scaly" in notes_lower or any("elevat" in s.lower() for s in symptoms):
            primary_code = "AKIEC"
            confidence = round(random.uniform(0.79, 0.87), 3)
        else:
            # Benign
            primary_code = "NV" if patient_age < 50 else "BKL"
            confidence = round(random.uniform(0.88, 0.95), 3)

        primary_info = cls.KNOWN_CONDITIONS[primary_code]

        # Generate calibrated differential diagnoses
        differentials = cls._build_differentials(primary_code, confidence)

        # Build ABCDE assessment
        abcde = cls._generate_abcde(
            primary_code,
            has_asymmetry,
            has_irregular_borders,
            has_color_variegation,
            has_rapid_evolution
        )

        # Determine triage priority & reasoning
        if primary_info["risk_level"] == "High":
            triage_priority = "Urgent"
            triage_reason = (
                f"Elevated risk of {primary_info['name']} ({confidence:.1%} confidence). "
                "Immediate specialist dermoscopy review and biopsy consultation recommended."
            )
        elif primary_info["risk_level"] == "Moderate":
            triage_priority = "Moderate"
            triage_reason = (
                f"Features consistent with {primary_info['name']}. "
                "Recommend clinical evaluation within 2 to 3 weeks."
            )
        else:
            triage_priority = "Routine"
            triage_reason = (
                f"Features indicate benign etiology ({primary_info['name']}). "
                "Standard routine surveillance and skin self-checks sufficient."
            )

        return {
            "primary_diagnosis": primary_info["name"],
            "condition_code": primary_code,
            "confidence": confidence,
            "malignancy_risk": primary_info["risk_level"],
            "triage_priority": triage_priority,
            "triage_reason": triage_reason,
            "differential_diagnoses": differentials,
            "abcde": abcde
        }

    @classmethod
    def _build_differentials(cls, primary_code: str, primary_conf: float) -> List[DiagnosisItem]:
        """Calculates normalized probability distribution across top conditions."""
        candidates = [code for code in cls.KNOWN_CONDITIONS if code != primary_code]
        random.shuffle(candidates)
        top_candidates = candidates[:3]

        remaining_prob = 1.0 - primary_conf
        raw_weights = [random.uniform(0.4, 0.8), random.uniform(0.2, 0.4), random.uniform(0.05, 0.15)]
        sum_weights = sum(raw_weights)
        probs = [round((w / sum_weights) * remaining_prob, 3) for w in raw_weights]

        # Fix rounding to ensure exact sum
        probs[0] = round(remaining_prob - sum(probs[1:]), 3)

        items = [
            DiagnosisItem(
                condition_code=primary_code,
                name=cls.KNOWN_CONDITIONS[primary_code]["name"],
                confidence=primary_conf,
                risk_level=cls.KNOWN_CONDITIONS[primary_code]["risk_level"],
                description=cls.KNOWN_CONDITIONS[primary_code]["description"],
                clinical_action=cls.KNOWN_CONDITIONS[primary_code]["clinical_action"]
            )
        ]

        for code, prob in zip(top_candidates, probs):
            info = cls.KNOWN_CONDITIONS[code]
            items.append(
                DiagnosisItem(
                    condition_code=code,
                    name=info["name"],
                    confidence=max(0.01, prob),
                    risk_level=info["risk_level"],
                    description=info["description"],
                    clinical_action=info["clinical_action"]
                )
            )

        # Sort by confidence descending
        items.sort(key=lambda x: x.confidence, reverse=True)
        return items

    @classmethod
    def _generate_abcde(
        cls,
        code: str,
        asym: bool,
        border: bool,
        color: bool,
        evol: bool
    ) -> ABCDEAssessment:
        is_malignant = code in ["MEL", "BCC", "SCC"]
        
        a_score = 0.85 if (asym or is_malignant) else 0.20
        b_score = 0.80 if (border or is_malignant) else 0.15
        c_score = 0.75 if (color or is_malignant) else 0.25
        d_score = 0.70 if is_malignant else 0.30
        e_score = 0.90 if evol else (0.65 if is_malignant else 0.10)

        total_score = round((a_score + b_score + c_score + d_score + e_score) / 5.0, 2)

        return ABCDEAssessment(
            asymmetry={
                "score": a_score,
                "label": "Marked Asymmetry" if a_score > 0.5 else "Bilateral Symmetry",
                "detail": "Axis decomposition displays 2-axis morphological discordance" if a_score > 0.5 else "Lesion halves demonstrate balanced geometric symmetry"
            },
            border={
                "score": b_score,
                "label": "Notched / Irregular" if b_score > 0.5 else "Smooth / Circumscribed",
                "detail": "Scalloped contours and abrupt pigment cutoff identified" if b_score > 0.5 else "Well-defined continuous perimeter with clear demarcation"
            },
            color={
                "score": c_score,
                "label": "Polychromatic Variegation" if c_score > 0.5 else "Monochromatic Uniform",
                "detail": "Multiple chromophore shades observed: dark brown, tan, and focal slate blue" if c_score > 0.5 else "Homogenous single-tone pigment distribution"
            },
            diameter={
                "score": d_score,
                "label": "> 6.0 mm (Clinical Concern)" if d_score > 0.5 else "< 6.0 mm (Standard)",
                "detail": "Estimated major lesion axis exceeds threshold 6mm" if d_score > 0.5 else "Estimated lesion diameter measured within standard range"
            },
            evolution={
                "score": e_score,
                "label": "Active Evolution Reported" if e_score > 0.5 else "Stable / Quiescent",
                "detail": "Recent morphologic change, itching, or size expansion documented" if e_score > 0.5 else "No acute change or symptomatic escalation reported"
            },
            total_suspicion_score=total_score
        )
