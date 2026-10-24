import React, { useState } from 'react';
import {
  Stethoscope,
  CheckCircle2,
  Camera,
  Send,
  AlertTriangle,
  FileText,
  UserCheck,
  ShieldAlert,
  Copy,
  ExternalLink,
  Printer,
  Sparkles,
  Info,
  Layers,
  Eye,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  ScreeningCase,
  ScreeningPriority,
  SpecialistReferral,
  ClinicianReview,
} from '../types';
import { computeScreeningPriority } from './PrototypeScreeningPriority';
import { Badge } from './Badge';
import { Button } from './Button';

interface ClinicianReviewPanelProps {
  screeningCase: ScreeningCase;
  onReviewSubmit?: (review: ClinicianReview) => Promise<void> | void;
  onReferralCreate?: (referral: SpecialistReferral) => Promise<void> | void;
  onRequestBetterImage?: (reason: string) => Promise<void> | void;
  onViewSummary?: () => void;
  className?: string;
}

export const ClinicianReviewPanel: React.FC<ClinicianReviewPanelProps> = ({
  screeningCase,
  onReviewSubmit,
  onReferralCreate,
  onRequestBetterImage,
  onViewSummary,
  className = '',
}) => {
  const priority: ScreeningPriority =
    screeningCase.screening_priority ||
    computeScreeningPriority(
      screeningCase.primary_diagnosis,
      screeningCase.confidence
    );

  // Clinician form state
  const [reviewerName, setReviewerName] = useState<string>(
    screeningCase.clinician_review?.reviewer_name || 'Dr. Julian Vance, MD, FAAD'
  );
  const [reviewerRole, setReviewerRole] = useState<string>(
    screeningCase.clinician_review?.reviewer_role || 'Attending Dermatologist'
  );
  const [clinicianNotes, setClinicianNotes] = useState<string>(
    screeningCase.clinician_review?.review_notes ||
      'Clinical examination corroborates neural Grad-CAM focus on notched asymmetric perimeter and atypical reticular globules. Management decision assigned accordingly.'
  );

  // Active review state & actions
  const [activeAction, setActiveAction] = useState<
    'none' | 'reviewed' | 'retake_requested' | 'referred'
  >(
    screeningCase.referral || screeningCase.status === 'Awaiting Specialist Review'
      ? 'referred'
      : screeningCase.status === 'Better Image Requested'
      ? 'retake_requested'
      : screeningCase.status === 'Reviewed'
      ? 'reviewed'
      : 'none'
  );

  const [activeReferral, setActiveReferral] = useState<SpecialistReferral | null>(
    screeningCase.referral ||
      (screeningCase.status === 'Awaiting Specialist Review'
        ? {
            referral_id: `REF-${screeningCase.case_id.replace('CASE-', '')}`,
            case_id: screeningCase.case_id,
            priority: priority,
            status: 'Awaiting Specialist Review',
            referred_at: new Date().toISOString(),
            clinician_notes: clinicianNotes,
            specialist_type: 'Dermatologic Oncology & Mohs Surgery',
          }
        : null)
  );

  const [specialistType, setSpecialistType] = useState<string>(
    'Dermatologic Oncology & Mohs Surgery'
  );
  const [retakeReason, setRetakeReason] = useState<string>(
    'Sub-optimal optical sharpness or lighting glare. Please recapture with 90° dermoscopic perpendicular orientation.'
  );

  const [copiedReferral, setCopiedReferral] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Grad-CAM layer view toggle (Overlay vs Heatmap vs Original)
  const [activeLayer, setActiveLayer] = useState<'blended' | 'heatmap' | 'original'>(
    'blended'
  );

  // Image source fallbacks
  const originalImageUrl =
    screeningCase.gradcam.original_data_url ||
    screeningCase.image_url ||
    '/samples/melanoma_sample.jpg';
  const heatmapImageUrl =
    screeningCase.gradcam.heatmap_data_url || originalImageUrl;
  const blendedImageUrl =
    screeningCase.gradcam.blended_data_url || originalImageUrl;

  const currentDisplayImage =
    activeLayer === 'heatmap'
      ? heatmapImageUrl
      : activeLayer === 'original'
      ? originalImageUrl
      : blendedImageUrl;

  // HANDLER: Mark as Reviewed
  const handleMarkAsReviewed = async () => {
    setIsSubmitting(true);
    const reviewData: ClinicianReview = {
      reviewer_name: reviewerName,
      reviewer_role: reviewerRole,
      review_notes: clinicianNotes,
      triage_verdict: 'Clinician Attested — Routine / Standard Care',
      final_risk_level: screeningCase.malignancy_risk,
      action_taken: 'Documented clinical findings and routine management plan',
      reviewed_at: new Date().toISOString(),
      action_type: 'reviewed',
    };

    try {
      if (onReviewSubmit) {
        await onReviewSubmit(reviewData);
      }
      setActiveAction('reviewed');
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HANDLER: Request Better Image
  const handleRequestBetterImage = async () => {
    setIsSubmitting(true);
    try {
      if (onRequestBetterImage) {
        await onRequestBetterImage(retakeReason);
      }
      setActiveAction('retake_requested');
    } catch (err) {
      console.error('Error requesting better image:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // HANDLER: Refer for Specialist Review
  const handleReferForSpecialist = async () => {
    setIsSubmitting(true);
    const refData: SpecialistReferral = {
      referral_id: `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      case_id: screeningCase.case_id,
      priority: priority,
      status: 'Awaiting Specialist Review',
      referred_at: new Date().toISOString(),
      clinician_notes: clinicianNotes,
      specialist_type: specialistType,
      urgency:
        priority === 'Prompt Professional Evaluation'
          ? 'Immediate'
          : priority === 'Review Recommended'
          ? 'Priority'
          : 'Routine',
    };

    try {
      if (onReferralCreate) {
        await onReferralCreate(refData);
      }
      setActiveReferral(refData);
      setActiveAction('referred');
    } catch (err) {
      console.error('Error creating referral:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReferralId = () => {
    if (activeReferral) {
      navigator.clipboard.writeText(activeReferral.referral_id);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2500);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden ${className}`}
      data-testid="clinician-review-panel"
    >
      {/* Top Section Header with Title CLINICIAN REVIEW */}
      <div className="bg-slate-900 px-6 py-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-white">
                CLINICIAN REVIEW
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Core Clinical Flow
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Review AI inference signals, inspect Grad-CAM activations, and assign definitive patient clinical action
            </p>
          </div>
        </div>

        {/* Current Case Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Case Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              activeAction === 'referred'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : activeAction === 'retake_requested'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : activeAction === 'reviewed'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
            }`}
          >
            {activeAction === 'referred'
              ? 'Awaiting Specialist Review'
              : activeAction === 'retake_requested'
              ? 'Better Image Requested'
              : activeAction === 'reviewed'
              ? 'Reviewed'
              : 'Awaiting Clinician Action'}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Clinician Responsibility Banner */}
        <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-950 flex items-start gap-3">
          <UserCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-slate-900">
              Clinician Responsibility Notice
            </h4>
            <p className="text-slate-700 leading-relaxed">
              The attending clinician remains solely responsible for the final clinical decision, patient management, and treatment plan. SkinLens serves exclusively as decision support.
            </p>
          </div>
        </div>

        {/* REQUIRED 5 CLINICAL DISPLAY INPUTS:
            1. Original Image
            2. AI Prediction
            3. Confidence
            4. Grad-CAM
            5. Screening Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Evidence (Original Image & Grad-CAM) - 6 cols */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Visual Evidence: Original vs. Grad-CAM
                </h4>
                <p className="text-[11px] text-slate-500">
                  Compare raw dermoscopy with convolutional feature activation
                </p>
              </div>

              {/* Layer switch buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveLayer('blended')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeLayer === 'blended'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overlay
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLayer('heatmap')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeLayer === 'heatmap'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Grad-CAM
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLayer('original')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeLayer === 'original'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Original
                </button>
              </div>
            </div>

            {/* Visual Viewport */}
            <div className="relative rounded-xl border border-slate-200 bg-slate-950 overflow-hidden flex items-center justify-center min-h-[300px]">
              <img
                src={currentDisplayImage}
                alt="Lesion visual evidence"
                className="w-full h-auto max-h-[360px] object-contain transition-all"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/samples/melanoma_sample.jpg';
                }}
              />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] text-white border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="font-semibold uppercase tracking-wider text-teal-300">
                    {activeLayer === 'blended'
                      ? 'Grad-CAM Heatmap Overlay'
                      : activeLayer === 'heatmap'
                      ? 'Raw Neural Saliency Heatmap'
                      : 'Original Optical Image'}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">
                  {screeningCase.quality.resolution.width}×{screeningCase.quality.resolution.height}px
                </span>
              </div>
            </div>

            {/* Side-by-Side mini thumbnails */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => setActiveLayer('original')}
                className={`cursor-pointer rounded-lg border p-2 flex items-center gap-2.5 transition-all ${
                  activeLayer === 'original'
                    ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <img
                  src={originalImageUrl}
                  alt="Original dermoscopy"
                  className="w-10 h-10 rounded object-cover border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/samples/melanoma_sample.jpg';
                  }}
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Original Image
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Raw acquisition
                  </span>
                </div>
              </div>

              <div
                onClick={() => setActiveLayer('blended')}
                className={`cursor-pointer rounded-lg border p-2 flex items-center gap-2.5 transition-all ${
                  activeLayer === 'blended'
                    ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-200'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <img
                  src={blendedImageUrl}
                  alt="Grad-CAM overlay"
                  className="w-10 h-10 rounded object-cover border border-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/samples/melanoma_sample.jpg';
                  }}
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Grad-CAM Overlay
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Layer-4 feature saliency
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Prediction, Confidence, Screening Priority - 6 cols */}
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Decision-Support Inference Signals
              </h4>

              {/* AI Prediction & Confidence Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    AI Prediction
                  </span>
                  <span className="text-xl font-black text-slate-900 mt-1 block tracking-tight">
                    {screeningCase.primary_diagnosis}
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-700 mt-0.5 block">
                    Condition Code: {screeningCase.condition_code}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Confidence
                  </span>
                  <span className="text-2xl font-black text-teal-600 font-mono mt-1 block">
                    {(screeningCase.confidence * 100).toFixed(1)}%
                  </span>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${screeningCase.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Screening Priority Card */}
              <div className="rounded-xl border border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Screening Priority
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      priority === 'Prompt Professional Evaluation'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : priority === 'Review Recommended'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-emerald-600 text-white shadow-xs'
                    }`}
                  >
                    {priority}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  "This is an AI-assisted screening signal intended to support professional review."
                </p>
              </div>

              {/* Grad-CAM Salient Regions Explanation */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Grad-CAM Interpretability Summary</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {screeningCase.gradcam.explanation_summary ||
                    'Neural activation focused on asymmetric perimeter notched margins and central atypical pigment globule clusters.'}
                </p>
                {screeningCase.gradcam.salient_regions &&
                  screeningCase.gradcam.salient_regions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {screeningCase.gradcam.salient_regions.map((reg, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-medium"
                        >
                          {reg}
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Clinician identity credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Clinician Name
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Role / Specialization
                </label>
                <input
                  type="text"
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CLINICIAN NOTES FIELD */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Clinician Notes & Evaluation Findings
            </label>
            <span className="text-[11px] text-slate-400">
              Document dermoscopy findings, pigment network evaluation, or biopsy instructions
            </span>
          </div>

          <textarea
            rows={3}
            value={clinicianNotes}
            onChange={(e) => setClinicianNotes(e.target.value)}
            placeholder="Record clinical rationale, differential considerations, physical palpation findings, or referral instructions..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none shadow-xs"
          />

          {/* Quick Notes Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Quick inserts:</span>
            {[
              'Grad-CAM focus correlates with peripheral border irregularity.',
              'Uniform melanocytic architecture; reassuring findings.',
              'Atypical pigment globules confirmed; excisional biopsy indicated.',
              'Sub-optimal illumination glare obscures center; retake requested.',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setClinicianNotes(preset)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-left"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* THREE REQUIRED CLINICAL ACTIONS:
            1. [ Mark as Reviewed ]
            2. [ Request Better Image ]
            3. [ Refer for Specialist Review ] */}
        <div className="pt-4 border-t border-slate-200">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Select Decision-Support Action
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Mark as Reviewed */}
            <Button
              type="button"
              onClick={handleMarkAsReviewed}
              isLoading={isSubmitting && activeAction === 'reviewed'}
              variant="outline"
              size="lg"
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              className={`w-full font-bold justify-center border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 ${
                activeAction === 'reviewed'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200'
                  : 'text-slate-800'
              }`}
            >
              Mark as Reviewed
            </Button>

            {/* Action 2: Request Better Image */}
            <Button
              type="button"
              onClick={handleRequestBetterImage}
              isLoading={isSubmitting && activeAction === 'retake_requested'}
              variant="outline"
              size="lg"
              leftIcon={<Camera className="w-4 h-4 text-amber-600" />}
              className={`w-full font-bold justify-center border-slate-300 hover:border-amber-500 hover:bg-amber-50/50 ${
                activeAction === 'retake_requested'
                  ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-200'
                  : 'text-slate-800'
              }`}
            >
              Request Better Image
            </Button>

            {/* Action 3: Refer for Specialist Review */}
            <Button
              type="button"
              onClick={handleReferForSpecialist}
              isLoading={isSubmitting && activeAction === 'referred'}
              variant="primary"
              size="lg"
              leftIcon={<Send className="w-4 h-4" />}
              className={`w-full font-extrabold justify-center bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 ${
                activeAction === 'referred'
                  ? 'ring-4 ring-rose-300 bg-rose-700'
                  : ''
              }`}
            >
              Refer for Specialist Review
            </Button>
          </div>
        </div>

        {/* REQUIRED REFERRAL VIEW:
            When "Refer for Specialist Review" is selected, show:
            Referral Created
            Case ID
            Priority
            Status: Awaiting Specialist Review */}
        {activeAction === 'referred' && (
          <div
            className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 via-white to-rose-50/60 border-2 border-rose-300 text-slate-900 shadow-md animate-in fade-in slide-in-from-top-3 duration-300"
            data-testid="referral-created-section"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-rose-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-rose-950 uppercase tracking-tight">
                      Referral Created
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      Active Referral
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Patient screening case has been routed to the specialist oncology queue for priority assessment.
                  </p>
                </div>
              </div>

              {/* Actions: Copy Referral & View Case Summary */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyReferralId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-bold text-rose-800 hover:bg-rose-100 transition-colors shrink-0 shadow-xs"
                >
                  {copiedReferral ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Case Referral</span>
                    </>
                  )}
                </button>

                {onViewSummary && (
                  <button
                    type="button"
                    onClick={onViewSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Case Summary</span>
                  </button>
                )}
              </div>
            </div>

            {/* Exactly Required Output Grid: Case ID, Priority, Status: Awaiting Specialist Review */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              {/* 1. Case ID */}
              <div className="bg-white/90 rounded-xl p-4 border border-rose-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Case ID
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-1 block">
                  {screeningCase.case_id}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Referral ID: {activeReferral?.referral_id || `REF-${screeningCase.case_id.replace('CASE-', '')}`}
                </span>
              </div>

              {/* 2. Priority */}
              <div className="bg-white/90 rounded-xl p-4 border border-rose-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Priority
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-extrabold ${
                      priority === 'Prompt Professional Evaluation'
                        ? 'bg-rose-600 text-white'
                        : priority === 'Review Recommended'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {priority}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1.5 block">
                  AI-assisted screening triage signal
                </span>
              </div>

              {/* 3. Status: Awaiting Specialist Review */}
              <div className="bg-white/90 rounded-xl p-4 border border-rose-200 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Status
                </span>
                <span className="text-base sm:text-lg font-black text-rose-700 mt-1 block">
                  Awaiting Specialist Review
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Routing: {specialistType}
                </span>
              </div>
            </div>

            {/* Additional Clinician Notes appended to referral */}
            <div className="bg-white/80 rounded-xl p-3.5 border border-rose-200/80 text-xs">
              <span className="font-bold text-slate-700 block mb-1">
                Referral Clinical Summary & Notes:
              </span>
              <p className="text-slate-800 italic leading-relaxed">
                "{clinicianNotes}"
              </p>
              <div className="mt-2 pt-2 border-t border-rose-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Referring Clinician: <strong>{reviewerName}</strong></span>
                <span>Referral Time: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Retake Requested Banner Feedback */}
        {activeAction === 'retake_requested' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-xs animate-in fade-in">
            <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-amber-900">
                Better Image Requested • Status: Better Image Requested
              </h4>
              <p className="text-amber-800 leading-relaxed">
                Instruction sent to acquisition nurse: "{retakeReason}"
              </p>
            </div>
          </div>
        )}

        {/* Reviewed Banner Feedback */}
        {activeAction === 'reviewed' && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <h4 className="font-bold text-emerald-900">
                  Case Reviewed Successfully • Status: Reviewed
                </h4>
                <p className="text-emerald-800 leading-relaxed">
                  Attested by {reviewerName}. Case status updated and logged in patient clinical history.
                </p>
              </div>
            </div>
            {onViewSummary && (
              <button
                type="button"
                onClick={onViewSummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition-colors shrink-0"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>View Case Summary</span>
              </button>
            )}
          </div>
        )}

        {/* MANDATORY SYSTEM DISCLAIMER (EXACT STRING REQUIRED) */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="font-medium text-slate-700 leading-relaxed">
            "SkinLens is an AI-assisted screening prototype and does not replace professional medical assessment or provide a definitive diagnosis."
          </p>
        </div>
      </div>
    </div>
  );
};
