import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ArrowRight,
  ChevronLeft,
  Stethoscope,
  Sparkles,
  Cpu,
  PlusCircle,
  AlertOctagon,
  Info,
} from 'lucide-react';
import { ScreeningCase, ScreeningApiResponse, ClinicianReview, SpecialistReferral } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { GradCAMViewer } from '../components/GradCAMViewer';
import { QualityIndicator } from '../components/QualityIndicator';
import { ABCDECard } from '../components/ABCDECard';
import { PrototypeScreeningPriority } from '../components/PrototypeScreeningPriority';
import { CaseTimeline } from '../components/CaseTimeline';
import { ClinicianReviewPanel } from '../components/ClinicianReviewPanel';
import { SkinLensApi } from '../services/api';

interface ScreeningResultPageProps {
  screeningCase: ScreeningCase;
  apiResponse?: ScreeningApiResponse;
  onProceedToReview: (caseId: string) => void;
  onBackToDashboard: () => void;
  onViewAllCases: () => void;
  onNewScreening?: () => void;
}

export const ScreeningResultPage: React.FC<ScreeningResultPageProps> = ({
  screeningCase: initialCase,
  apiResponse,
  onProceedToReview,
  onBackToDashboard,
  onViewAllCases,
  onNewScreening,
}) => {
  const [currentCase, setCurrentCase] = useState<ScreeningCase>(initialCase);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const modelName = apiResponse?.model?.architecture || 'EfficientNet-B0';
  const modelSource = apiResponse?.model?.source || 'Hugging Face';
  const processingTime = apiResponse?.processing_time ?? 0.22;
  const qualityValid = apiResponse?.quality?.valid ?? currentCase.quality.is_acceptable;
  const qualityScore =
    apiResponse?.quality?.score ?? (currentCase.quality.sharpness_score / 100);

  // Clinician review action handlers
  const handleReviewSubmit = async (review: ClinicianReview) => {
    try {
      const updated = await SkinLensApi.markAsReviewed(currentCase.case_id, review);
      setCurrentCase(updated);
      setFeedbackNotice('Case marked as Reviewed. Clinical attestation saved.');
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  const handleReferralCreate = async (referral: SpecialistReferral) => {
    try {
      const updated = await SkinLensApi.referCase(currentCase.case_id, referral);
      setCurrentCase(updated);
      setFeedbackNotice('Referral created. Case routed to specialist review queue.');
      setTimeout(() => setFeedbackNotice(null), 5000);
    } catch (err) {
      console.error('Failed to create referral:', err);
    }
  };

  const handleRequestBetterImage = async (reason: string) => {
    try {
      const updated = await SkinLensApi.requestImageRetake(currentCase.case_id, reason);
      setCurrentCase(updated);
      setFeedbackNotice('Image retake requested. Status updated.');
      setTimeout(() => setFeedbackNotice(null), 5000);
    } catch (err) {
      console.error('Failed to request retake:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-24">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Dashboard
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                {currentCase.case_id}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Patient: {currentCase.patient_name}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              AI-Assisted Lesion Screening & Decision Support
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNewScreening && (
            <Button
              onClick={onNewScreening}
              variant="outline"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              New Screening
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print Slip
          </Button>
          <Button
            onClick={() => onProceedToReview(currentCase.case_id)}
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 font-semibold"
          >
            Full Case Profile
          </Button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {feedbackNotice && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-sm flex items-center gap-3 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <p className="font-semibold">{feedbackNotice}</p>
        </div>
      )}

      {/* MANDATORY SYSTEM DISCLAIMER:
          "SkinLens is an AI-assisted screening prototype and does not replace professional medical assessment or provide a definitive diagnosis." */}
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs flex items-start gap-3 shadow-xs">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-amber-900 block uppercase tracking-wide text-[11px]">
            Clinical Decision-Support Notice
          </span>
          <p className="text-slate-800 leading-relaxed font-medium">
            "SkinLens is an AI-assisted screening prototype and does not replace professional medical assessment or provide a definitive diagnosis."
          </p>
        </div>
      </div>

      {/* Poor Image Quality Warning if flagged by optical heuristics */}
      {!qualityValid && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-900 flex items-center gap-2">
              Image Quality Warning (Score: {(qualityScore * 100).toFixed(0)}%)
            </h4>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              Optical heuristics detected sub-optimal blur, low contrast, or inadequate resolution in this photo. While the AI model processed the image, high-confidence clinical screening requires uniform lighting, perpendicular dermoscopic alignment, and sharp focal clarity.
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: PROTOTYPE SCREENING PRIORITY */}
      <PrototypeScreeningPriority
        prediction={currentCase.primary_diagnosis}
        confidence={currentCase.confidence}
        priority={currentCase.screening_priority}
      />

      {/* SECTION 2: CLINICIAN REVIEW PANEL */}
      <ClinicianReviewPanel
        screeningCase={currentCase}
        onReviewSubmit={handleReviewSubmit}
        onReferralCreate={handleReferralCreate}
        onRequestBetterImage={handleRequestBetterImage}
      />

      {/* SECTION 3: 7-STEP CASE TIMELINE */}
      <CaseTimeline
        screeningCase={currentCase}
        referral={currentCase.referral}
      />

      {/* EXPLAINABLE AI: GRAD-CAM VISUAL EXPLANATION & METRICS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Explainable AI: Real Grad-CAM Visualization
            </h3>
            <p className="text-xs text-slate-500">
              Visual proof from the convolutional feature layer verifying what pixels guided the model
            </p>
          </div>
        </div>

        <GradCAMViewer
          gradcam={currentCase.gradcam}
          primaryDiagnosis={currentCase.primary_diagnosis}
          confidence={currentCase.confidence}
          modelArchitecture={modelName}
          modelSource={modelSource}
        />
      </div>

      {/* TOP PREDICTIONS SPECTRUM & CLINICAL DIFFERENTIALS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Predictions (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Top Neural Predictions
              </h4>
              <p className="text-xs text-slate-500">
                Probability distribution from the final softmax layer
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">
              Top {currentCase.differential_diagnoses.length} Classes
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {currentCase.differential_diagnoses.map((diag, index) => {
              const pct = (diag.confidence * 100).toFixed(1);
              return (
                <div key={diag.condition_code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <span className="font-bold text-slate-900">{diag.name}</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        ({diag.condition_code})
                      </span>
                    </div>
                    <span className="font-bold font-mono text-slate-900 text-sm">
                      {pct}%
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0
                          ? 'bg-teal-600'
                          : index === 1
                          ? 'bg-sky-600'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(5, diag.confidence * 100)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {diag.clinical_action}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient Demographics & Optical Quality (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <QualityIndicator quality={currentCase.quality} />
        </div>
      </div>

      {/* ABCDE Dermatological Criteria Breakdown */}
      <ABCDECard abcde={currentCase.abcde} />
    </div>
  );
};
