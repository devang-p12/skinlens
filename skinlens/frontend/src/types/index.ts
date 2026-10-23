export interface ImageResolution {
  width: number;
  height: number;
}

export interface ImageQualityResult {
  is_acceptable: boolean;
  quality_rating: 'Optimal' | 'Good' | 'Sub-optimal' | 'Unacceptable' | string;
  sharpness_score: number;
  lighting_score: number;
  contrast_score: number;
  resolution: ImageResolution;
  issues: string[];
  recommendations: string[];
}

export interface DiagnosisItem {
  condition_code: string;
  name: string;
  confidence: number;
  risk_level: 'High' | 'Moderate' | 'Low' | string;
  description: string;
  clinical_action: string;
}

export interface ABCDEDetail {
  score: number;
  label: string;
  detail: string;
}

export interface ABCDEAssessment {
  asymmetry: ABCDEDetail;
  border: ABCDEDetail;
  color: ABCDEDetail;
  diameter: ABCDEDetail;
  evolution: ABCDEDetail;
  total_suspicion_score: number;
}

export interface GradCAMExplanation {
  heatmap_data_url: string;
  blended_data_url: string;
  original_data_url: string;
  explanation_summary: string;
  salient_regions: string[];
  focal_intensity: number;
}

export type ScreeningPriority =
  | 'Routine Follow-up'
  | 'Review Recommended'
  | 'Prompt Professional Evaluation';

export interface SpecialistReferral {
  referral_id: string;
  case_id: string;
  priority: ScreeningPriority;
  status: 'Awaiting Specialist Review';
  referred_at: string;
  clinician_notes?: string;
  specialist_type?: string;
  urgency?: 'Immediate' | 'Priority' | 'Routine' | string;
}

export interface ClinicianReview {
  reviewer_name: string;
  reviewer_role: string;
  review_notes: string;
  triage_verdict: string;
  final_risk_level: 'High' | 'Moderate' | 'Low' | string;
  action_taken: string;
  reviewed_at: string;
  action_type?: 'reviewed' | 'retake_requested' | 'referred';
}

export interface ScreeningCase {
  case_id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  lesion_location: string;
  duration: string;
  clinical_notes?: string;
  symptoms: string[];
  quality: ImageQualityResult;
  primary_diagnosis: string;
  condition_code: string;
  confidence: number;
  malignancy_risk: 'High' | 'Moderate' | 'Low' | string;
  triage_priority: 'Urgent' | 'Moderate' | 'Routine' | string;
  triage_reason: string;
  screening_priority?: ScreeningPriority;
  referral?: SpecialistReferral | null;
  image_url?: string;
  differential_diagnoses: DiagnosisItem[];
  abcde: ABCDEAssessment;
  gradcam: GradCAMExplanation;
  status:
    | 'Awaiting Review'
    | 'Under Review'
    | 'Reviewed'
    | 'Awaiting Specialist Review'
    | 'Better Image Requested'
    | string;
  clinician_review?: ClinicianReview | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  screenings_today: number;
  cases_awaiting_review: number;
  review_recommended: number;
  high_risk_detected: number;
  total_screenings: number;
}

export type PageView = 'dashboard' | 'new-screening' | 'result' | 'cases' | 'case-details';

export interface ScreeningApiTopPrediction {
  class: string;
  confidence: number;
}

export interface ScreeningApiResponse {
  case_id: string;
  quality: {
    valid: boolean;
    score: number;
  };
  prediction: {
    class: string;
    confidence: number;
    top_predictions: ScreeningApiTopPrediction[];
  };
  explanation: {
    heatmap_url: string;
    overlay_url: string;
  };
  model: {
    architecture: string;
    source: string;
  };
  processing_time: number;
}

export interface ScreeningWorkflowData {
  apiResponse: ScreeningApiResponse;
  patientName: string;
  patientAge: number;
  lesionLocation: string;
  duration: string;
  clinicalNotes: string;
  imageFileName: string;
  imageFileSize: string;
  imageDimensions: string;
  originalImagePreview: string;
}
