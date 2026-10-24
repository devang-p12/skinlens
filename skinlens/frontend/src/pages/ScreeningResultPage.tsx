import React, { useState, useRef, useEffect } from 'react';
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
  FileText,
  Sliders,
  Layers,
  Check,
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
import { WorkflowIndicator, WorkflowStepId } from '../components/WorkflowIndicator';
import { CaseSummaryModal } from '../components/CaseSummaryModal';
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
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [animatedConfidence, setAnimatedConfidence] = useState<number>(0);

  // Animate confidence count-up on mount
  useEffect(() => {
    const target = initialCase.confidence * 100;
    const duration = 1200;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedConfidence(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [initialCase.confidence]);


  // Section anchor references for smooth-scrolling via WorkflowIndicator
  const analyzeRef = useRef<HTMLDivElement>(null);
  const explainRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  const modelName = apiResponse?.model?.architecture || 'EfficientNet-B0';
  const modelSource = apiResponse?.model?.source || 'Hugging Face';
  const processingTime = apiResponse?.processing_time ?? 0.22;
  const qualityValid = apiResponse?.quality?.valid ?? currentCase.quality.is_acceptable;
  const qualityScore =
    apiResponse?.quality?.score ?? (currentCase.quality.sharpness_score / 100);

  const handleStepClick = (stepId: WorkflowStepId) => {
    if (stepId === 'analyze' && analyzeRef.current) {
      analyzeRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (stepId === 'explain' && explainRef.current) {
      explainRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (stepId === 'action' && actionRef.current) {
      actionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
      {/* 5-Step Workflow Stepper Indicator */}
      <WorkflowIndicator
        currentStep="action"
        completedSteps={['capture', 'validate', 'analyze', 'explain']}
        onStepClick={handleStepClick}
      />

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

        <div className="flex flex-wrap items-center gap-2">
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

          {/* VIEW CASE SUMMARY BUTTON */}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileText className="w-4 h-4 text-teal-600" />}
            onClick={() => setIsSummaryModalOpen(true)}
            className="border-teal-300 text-teal-800 hover:bg-teal-50 font-semibold"
          >
            Case Summary
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

      {/* =========================================================================
          RESULT HERO CARD — Immediate visual summary of AI findings
          ========================================================================= */}
      {(() => {
        const priority = currentCase.screening_priority || 'Review Recommended';
        const isPrompt = priority === 'Prompt Professional Evaluation';
        const isReview = priority === 'Review Recommended';
        const heroBg = isPrompt
          ? 'from-rose-950 via-[#2a0a0a] to-slate-950 border-rose-800/40'
          : isReview
          ? 'from-amber-950 via-[#2a1a00] to-slate-950 border-amber-800/40'
          : 'from-emerald-950 via-[#002a14] to-slate-950 border-emerald-800/40';
        const priorityPillStyle = isPrompt
          ? 'text-rose-300 bg-rose-500/15 border-rose-500/30'
          : isReview
          ? 'text-amber-300 bg-amber-500/15 border-amber-500/30'
          : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
        const barColor = isPrompt ? 'bg-rose-400' : isReview ? 'bg-amber-400' : 'bg-emerald-400';
        const dotColor = isPrompt ? 'bg-rose-400' : isReview ? 'bg-amber-400' : 'bg-emerald-400';
        return (
          <div className={`rounded-2xl border bg-gradient-to-br ${heroBg} p-6 sm:p-8 text-white shadow-2xl`}>
            {/* Case ID + meta row */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-[11px] font-black font-mono px-2.5 py-1 rounded-lg bg-white/8 text-white/60 border border-white/10">
                {currentCase.case_id}
              </span>
              <span className="text-[11px] text-white/40 font-semibold">
                Patient: {currentCase.patient_name}
              </span>
              <span className="text-[11px] text-white/30 hidden sm:inline">
                · {modelName} · {(processingTime * 1000).toFixed(0)}ms inference
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {/* AI Prediction */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  AI Prediction
                </p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                  {currentCase.primary_diagnosis}
                </h2>
                <p className="text-xs text-white/30 mt-1 font-mono">{currentCase.condition_code}</p>
              </div>

              {/* Confidence */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  Model Confidence
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-white">
                    {animatedConfidence.toFixed(1)}
                  </span>
                  <span className="text-lg font-bold text-white/50">%</span>
                </div>
                <div className="mt-2.5 w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${Math.min(100, animatedConfidence)}%`, transition: 'none' }}
                  />
                </div>
                <p className="text-[10px] text-white/25 mt-1">Softmax over 7 classes</p>
              </div>

              {/* Screening Priority */}
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  Screening Priority
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor} ring-2 ring-white/20`} />
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black border ${priorityPillStyle}`}>
                    {priority}
                  </span>
                </div>
                <p className="text-[10px] text-white/25 leading-relaxed">
                  AI-assisted triage signal. Not a clinical diagnosis.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Poor Image Quality Warning if flagged by heuristics */}
      {!qualityValid && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-900 flex items-center gap-2">
              Image Quality Warning (Score: {(qualityScore * 100).toFixed(0)}%)
            </h4>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              Optical heuristics detected sub-optimal blur, low contrast, or inadequate resolution in this photo. High-confidence clinical screening requires uniform lighting, perpendicular dermoscopic alignment, and sharp focal clarity.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          FLOW STEP 3: PREDICTION + CONFIDENCE & DIFFERENTIAL DIAGNOSES
          ========================================================================= */}

      <div ref={analyzeRef} className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center font-mono">
              03
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              AI Analysis: Prediction & Softmax Confidence
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {modelName} • Inference: {(processingTime * 1000).toFixed(0)}ms
          </span>
        </div>

        {/* Primary Prediction Banner + Probability Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Prediction Highlight Card (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Primary Classification Signal
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {currentCase.primary_diagnosis}
              </h2>
              <div className="flex items-center gap-2 pt-1">
                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  ICD / Code: {currentCase.condition_code}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentCase.differential_diagnoses[0]?.clinical_action || 'Clinical inspection advised'}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-500">Model Confidence:</span>
                <span className="text-2xl font-black font-mono text-teal-600">
                  {(currentCase.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full animate-bar-grow"
                  style={{ width: `${Math.min(100, currentCase.confidence * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 italic">
                *Softmax probability calibrated across 7 diagnostic disease classes
              </p>
            </div>
          </div>

          {/* Differential Diagnoses Spectrum (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Differential Distribution (Top Classes)
              </span>
              <span className="text-xs font-mono text-slate-400">
                PyTorch Softmax Vector
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {currentCase.differential_diagnoses.map((diag, index) => {
                const pct = (diag.confidence * 100).toFixed(1);
                return (
                  <div key={diag.condition_code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-800">{diag.name}</span>
                        <span className="font-mono text-slate-400 text-[10px]">
                          ({diag.condition_code})
                        </span>
                      </div>
                      <span className="font-bold font-mono text-slate-900">
                        {pct}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full animate-bar-grow ${
                          index === 0
                            ? 'bg-teal-600'
                            : index === 1
                            ? 'bg-sky-600'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${Math.max(4, diag.confidence * 100)}%`, animationDelay: `${index * 80}ms` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FLOW STEP 4: GRAD-CAM SALIENCY LENS (THE VISUAL HIGHLIGHT OF THE DEMO)
          ========================================================================= */}
      <div ref={explainRef} className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center font-mono">
              04
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              Explainable AI: Real Grad-CAM Visualization
            </h3>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            Interactive Visual Highlight
          </span>
        </div>

        <div className="relative animate-gradcam-glow rounded-2xl">
          {/* Ambient glow behind the GradCAM viewer */}
          <div className="absolute -inset-2 bg-teal-500/8 rounded-3xl blur-2xl pointer-events-none" />
          <GradCAMViewer
            gradcam={currentCase.gradcam}
            primaryDiagnosis={currentCase.primary_diagnosis}
            confidence={currentCase.confidence}
            modelArchitecture={modelName}
            modelSource={modelSource}
          />
        </div>
      </div>


      {/* =========================================================================
          FLOW STEP 5: CLINICAL ACTION (PRIORITY + REVIEW + REFERRAL + SUMMARY)
          ========================================================================= */}
      <div ref={actionRef} className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-teal-50 text-teal-700 font-bold text-xs flex items-center justify-center font-mono">
              05
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              Clinical Action: Screening Priority, Clinician Review & Referral
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Human-in-the-Loop Decision Support
          </span>
        </div>

        {/* PROTOTYPE SCREENING PRIORITY */}
        <PrototypeScreeningPriority
          prediction={currentCase.primary_diagnosis}
          confidence={currentCase.confidence}
          priority={currentCase.screening_priority}
        />

        {/* CLINICIAN REVIEW PANEL */}
        <ClinicianReviewPanel
          screeningCase={currentCase}
          onReviewSubmit={handleReviewSubmit}
          onReferralCreate={handleReferralCreate}
          onRequestBetterImage={handleRequestBetterImage}
          onViewSummary={() => setIsSummaryModalOpen(true)}
        />

        {/* 7-STEP CASE TIMELINE */}
        <CaseTimeline
          screeningCase={currentCase}
          referral={currentCase.referral}
        />

        {/* Patient Demographics & Optical Quality */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <QualityIndicator quality={currentCase.quality} />
          </div>
          <div className="lg:col-span-6">
            <ABCDECard abcde={currentCase.abcde} />
          </div>
        </div>
      </div>

      {/* CASE SUMMARY MODAL (THE FINAL STOP IN THE DEMO FLOW) */}
      <CaseSummaryModal
        screeningCase={currentCase}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />
    </div>
  );
};
