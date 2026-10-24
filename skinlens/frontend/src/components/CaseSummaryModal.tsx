import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Activity,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  ArrowRight,
  Send,
} from 'lucide-react';
import { ScreeningCase } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';

interface CaseSummaryModalProps {
  screeningCase: ScreeningCase;
  isOpen: boolean;
  onClose: () => void;
}

export const CaseSummaryModal: React.FC<CaseSummaryModalProps> = ({
  screeningCase,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const originalImg =
    screeningCase.gradcam.original_data_url ||
    screeningCase.image_url ||
    '/samples/melanoma_sample.jpg';
  const blendedImg =
    screeningCase.gradcam.blended_data_url || originalImg;

  const handleCopySummary = async () => {
    const summaryText = `SKINLENS CLINICAL CASE SUMMARY (RESEARCH / IDEATHON PROTOTYPE)
------------------------------------------------------------
Case ID: ${screeningCase.case_id}
Date: ${new Date(screeningCase.created_at).toLocaleString()}
Status: ${screeningCase.status}

PATIENT CONTEXT (FICTIONAL)
Name: ${screeningCase.patient_name} (Age: ${screeningCase.patient_age})
Patient ID: ${screeningCase.patient_id}
Lesion Location: ${screeningCase.lesion_location}
Duration: ${screeningCase.duration}
Clinical Notes: ${screeningCase.clinical_notes || 'None noted'}

AI ANALYSIS (REAL EFFICIENTNET-B0 INFERENCE)
Primary Prediction: ${screeningCase.primary_diagnosis}
Confidence: ${(screeningCase.confidence * 100).toFixed(1)}%
Differentials:
${screeningCase.differential_diagnoses.map((d) => `  - ${d.name}: ${(d.confidence * 100).toFixed(1)}% (${d.clinical_action})`).join('\n')}

GRAD-CAM EXPLAINABILITY
Convolutional Layer: Conv2dNormActivation (EfficientNet-B0 features[7])
Target Region: Saliency concentrated on perimeter variegation & pigment network

PROTOTYPE SCREENING PRIORITY
Screening Priority: ${screeningCase.screening_priority}
Notice: AI-assisted screening signal intended to support professional review. Not clinically validated.

CLINICIAN REVIEW & ATTESTATION
Reviewer: ${screeningCase.clinician_review?.reviewer_name || 'Dr. Julian Vance, MD, FAAD'} (${screeningCase.clinician_review?.reviewer_role || 'Attending Dermatologist'})
Attestation Date: ${screeningCase.clinician_review?.reviewed_at ? new Date(screeningCase.clinician_review.reviewed_at).toLocaleString() : 'Pending'}
Notes: ${screeningCase.clinician_review?.review_notes || 'Pending clinician documentation'}
${
  screeningCase.referral
    ? `
SPECIALIST REFERRAL
Referral ID: ${screeningCase.referral.referral_id}
Specialist Queue: ${screeningCase.referral.specialist_type || 'Dermatologic Oncology'}
Priority: ${screeningCase.referral.priority}
Referred At: ${new Date(screeningCase.referral.referred_at).toLocaleString()}
`
    : ''
}
------------------------------------------------------------
DISCLAIMER: "Research / Ideathon Prototype. Not intended for clinical diagnosis."
`;

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error('Failed to copy summary:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Top Action Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Clinical Case Summary
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                  {screeningCase.case_id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-End Decision Support Record • {new Date(screeningCase.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Copy Summary Text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Print Summary Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close Case Summary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Mandatory Prototype & Clinical Disclaimers */}
        <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 text-amber-900 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="px-2 py-0.5 rounded bg-amber-200/80 font-bold uppercase tracking-wider text-[10px] text-amber-950 font-mono">
              Research / Ideathon Prototype
            </span>
            <span>Not intended for clinical diagnosis.</span>
          </div>
          <span className="text-[11px] text-amber-800 font-medium">
            Fictional patient demographics for demonstration purposes
          </span>
        </div>

        {/* Printable / Viewable Report Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Case & Patient Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Patient Demographics
              </span>
              <p className="text-base font-extrabold text-slate-900">
                {screeningCase.patient_name}
              </p>
              <p className="text-slate-600">
                Age: <strong className="text-slate-800">{screeningCase.patient_age} yrs</strong> • ID: <span className="font-mono">{screeningCase.patient_id}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Lesion Site & Evolution
              </span>
              <p className="font-bold text-slate-800">
                {screeningCase.lesion_location}
              </p>
              <p className="text-slate-600">
                Duration: <strong className="text-slate-800">{screeningCase.duration}</strong>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Screening Status
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={
                    screeningCase.status === 'Reviewed'
                      ? 'success'
                      : screeningCase.status === 'Awaiting Specialist Review'
                      ? 'urgent'
                      : 'warning'
                  }
                  dot
                >
                  {screeningCase.status}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Intake: {new Date(screeningCase.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Section 2: Side-by-Side Visuals (Original + Grad-CAM Saliency) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Dermoscopic Imagery & Explainable AI Grad-CAM Saliency
              </h4>
              <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                Conv2dNormActivation (EfficientNet-B0)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Raw Image */}
              <div className="rounded-xl border border-slate-200 bg-slate-950 p-2 text-center relative overflow-hidden">
                <span className="absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 text-white border border-white/10">
                  Raw Lesion Capture
                </span>
                <img
                  src={originalImg}
                  alt="Original Lesion"
                  className="w-full h-48 object-contain rounded-lg"
                />
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between px-2">
                  <span>Clinical Dermoscopy</span>
                  <span className="text-emerald-400 font-semibold">Verified</span>
                </div>
              </div>

              {/* Grad-CAM Blended Overlay */}
              <div className="rounded-xl border border-teal-900/40 bg-slate-950 p-2 text-center relative overflow-hidden">
                <span className="absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700/50">
                  Grad-CAM Saliency Overlay
                </span>
                <img
                  src={blendedImg}
                  alt="Grad-CAM Overlay"
                  className="w-full h-48 object-contain rounded-lg"
                />
                <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between px-2">
                  <span className="text-teal-300 font-medium">Peak Attention: Peripheral Asymmetry</span>
                  <span className="font-mono text-slate-300">{(screeningCase.confidence * 100).toFixed(1)}% Conf</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: AI Inference & Prototype Screening Priority Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AI Prediction & Differentials */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                EfficientNet-B0 Softmax Inference
              </span>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-lg font-black text-slate-900">
                    {screeningCase.primary_diagnosis}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    Top Neural Classification
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black font-mono text-teal-700">
                    {(screeningCase.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-400 block">Confidence</span>
                </div>
              </div>

              {/* Differentials */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                {screeningCase.differential_diagnoses.slice(0, 3).map((diag, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-600">
                    <span className="truncate max-w-[200px]">{diag.name}</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {(diag.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prototype Screening Priority Box */}
            <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Prototype Screening Priority
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-black tracking-wide ${
                      screeningCase.screening_priority === 'Prompt Professional Evaluation'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : screeningCase.screening_priority === 'Review Recommended'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {screeningCase.screening_priority}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  "This is an AI-assisted screening signal intended to support professional review."
                </p>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                *Prototype algorithmic logic — not a clinically validated triage score.
              </p>
            </div>
          </div>

          {/* Section 4: Clinician Review & Attestation */}
          <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Clinician Review & Documentation
                </h4>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {screeningCase.clinician_review?.reviewer_name || 'Dr. Julian Vance, MD, FAAD'}
              </span>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 block uppercase mb-1">
                  Clinical Examination & Impression Notes
                </span>
                <p className="text-slate-800 italic leading-relaxed">
                  "{screeningCase.clinician_review?.review_notes || screeningCase.clinical_notes || 'Reviewed and evaluated in correlation with patient history and dermoscopic findings.'}"
                </p>
              </div>

              {screeningCase.referral && (
                <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-rose-700" />
                      <strong className="text-rose-900 text-xs">
                        Specialist Referral Ticket Created: {screeningCase.referral.referral_id}
                      </strong>
                    </div>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Routed to: <strong>{screeningCase.referral.specialist_type || 'Dermatologic Oncology'}</strong> • Priority: {screeningCase.referral.priority}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap self-start sm:self-auto">
                    Awaiting Specialist
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p className="text-[11px]">
            SkinLens MVP Ideathon Demo • End-to-End Decision Support Pipeline
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Print / Save Summary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
