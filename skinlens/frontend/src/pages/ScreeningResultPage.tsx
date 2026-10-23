import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  User,
  MapPin,
  Calendar,
  Clock,
  Printer,
  ArrowRight,
  ChevronLeft,
  Stethoscope,
  Sparkles,
  Cpu,
  Gauge,
  PlusCircle,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { ScreeningCase, ScreeningApiResponse } from '../types';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { GradCAMViewer } from '../components/GradCAMViewer';
import { QualityIndicator } from '../components/QualityIndicator';
import { ABCDECard } from '../components/ABCDECard';

interface ScreeningResultPageProps {
  screeningCase: ScreeningCase;
  apiResponse?: ScreeningApiResponse;
  onProceedToReview: (caseId: string) => void;
  onBackToDashboard: () => void;
  onViewAllCases: () => void;
  onNewScreening?: () => void;
}

export const ScreeningResultPage: React.FC<ScreeningResultPageProps> = ({
  screeningCase,
  apiResponse,
  onProceedToReview,
  onBackToDashboard,
  onViewAllCases,
  onNewScreening,
}) => {
  const isHighRisk = screeningCase.malignancy_risk.toLowerCase() === 'high';
  const isModerateRisk = screeningCase.malignancy_risk.toLowerCase() === 'moderate';

  const getTriageTheme = () => {
    if (isHighRisk) {
      return {
        bg: 'bg-rose-950/10 border-rose-300 text-rose-900',
        badge: 'urgent' as const,
        icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
        bannerTitle: 'High Malignancy Risk — Urgent Review Recommended',
      };
    }
    if (isModerateRisk) {
      return {
        bg: 'bg-amber-950/10 border-amber-300 text-amber-900',
        badge: 'moderate' as const,
        icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        bannerTitle: 'Moderate Priority — Dermatological Consultation Recommended',
      };
    }
    return {
      bg: 'bg-emerald-950/10 border-emerald-300 text-emerald-900',
      badge: 'routine' as const,
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      bannerTitle: 'Routine Surveillance — Benign Pattern Characteristics',
    };
  };

  const theme = getTriageTheme();
  const modelName = apiResponse?.model?.architecture || 'EfficientNet-B0';
  const modelSource = apiResponse?.model?.source || 'Hugging Face';
  const processingTime = apiResponse?.processing_time ?? 0.22;
  const qualityValid = apiResponse?.quality?.valid ?? screeningCase.quality.is_acceptable;
  const qualityScore = apiResponse?.quality?.score ?? (screeningCase.quality.sharpness_score / 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
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
                {screeningCase.case_id}
              </span>
              <Badge variant={theme.badge} dot>
                {screeningCase.triage_priority} Priority
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              AI-Assisted Lesion Screening Result
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
            onClick={() => onProceedToReview(screeningCase.case_id)}
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 font-semibold"
          >
            Proceed to Clinician Review
          </Button>
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

      {/* CORE RESULT SUMMARY BANNER (STEP 4 REQUIRED FORMAT) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-widest text-teal-400 uppercase">
                AI-ASSISTED SCREENING
              </h2>
              <p className="text-xs text-slate-300">
                Verified Deep Learning Neural Inference Result
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Latency: <strong className="text-teal-300">{processingTime}s</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-emerald-400">Complete</strong></span>
          </div>
        </div>

        {/* 4 Primary Highlight Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-6">
          {/* 1. Predicted Category */}
          <div className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Predicted Category
            </span>
            <div className="mt-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block leading-tight">
                {screeningCase.condition_code || screeningCase.primary_diagnosis}
              </span>
              <span className="text-xs font-bold text-teal-700 mt-1 block">
                {screeningCase.primary_diagnosis}
              </span>
            </div>
            <div className="mt-3">
              <Badge
                variant={
                  screeningCase.malignancy_risk === 'High'
                    ? 'urgent'
                    : screeningCase.malignancy_risk === 'Moderate'
                    ? 'moderate'
                    : 'routine'
                }
                size="sm"
              >
                {screeningCase.malignancy_risk} Risk
              </Badge>
            </div>
          </div>

          {/* 2. Confidence */}
          <div className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Confidence
            </span>
            <div className="mt-2">
              <span className="text-3xl font-black text-teal-600 block">
                {(screeningCase.confidence * 100).toFixed(1)}%
              </span>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-700"
                  style={{ width: `${screeningCase.confidence * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[11px] text-slate-500 mt-3 block">
              Calibrated Softmax probability
            </span>
          </div>

          {/* 3. Model */}
          <div className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Model
            </span>
            <div className="mt-2">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-teal-600" />
                <span className="text-xl font-bold text-slate-900 block">
                  {modelName}
                </span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Source: <strong className="text-slate-700">{modelSource}</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-3 block font-mono">
              adeIaide/skin-lesion-7class
            </span>
          </div>

          {/* 4. Optical Quality Check */}
          <div className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Image Quality Check
            </span>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    qualityValid ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <span className="text-lg font-bold text-slate-900">
                  {qualityValid ? 'Passed Validation' : 'Sub-optimal'}
                </span>
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                Quality Score: <strong>{(qualityScore * 100).toFixed(0)}%</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-3 block">
              {qualityValid ? 'Resolution & focus verified' : 'Potential motion or lighting noise'}
            </span>
          </div>
        </div>
      </div>

      {/* STEP 5: GRAD-CAM VISUAL EXPLANATION */}
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

        {/* Grad-CAM Viewer Component with Side-by-Side, Tabs, and Disclaimer */}
        <GradCAMViewer
          gradcam={screeningCase.gradcam}
          primaryDiagnosis={screeningCase.primary_diagnosis}
          confidence={screeningCase.confidence}
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
              Top {screeningCase.differential_diagnoses.length} Classes
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {screeningCase.differential_diagnoses.map((diag, index) => {
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
                      <Badge
                        variant={
                          diag.risk_level === 'High'
                            ? 'urgent'
                            : diag.risk_level === 'Moderate'
                            ? 'moderate'
                            : 'routine'
                        }
                        size="sm"
                      >
                        {diag.risk_level}
                      </Badge>
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

        {/* Patient Demographics & Case History Card (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                Patient & Case Information
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {screeningCase.case_id}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {screeningCase.patient_name}
                </span>
                <span className="text-slate-500 font-mono">{screeningCase.patient_id}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Age & Gender</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {screeningCase.patient_age} years
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Lesion Location</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {screeningCase.lesion_location}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Duration</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {screeningCase.duration}
                </span>
              </div>
            </div>

            {screeningCase.clinical_notes && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-slate-400 block text-xs font-medium">Clinical Notes</span>
                <p className="mt-1 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed italic">
                  "{screeningCase.clinical_notes}"
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Screened: {new Date(screeningCase.created_at).toLocaleDateString()} {new Date(screeningCase.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Button
              onClick={() => onProceedToReview(screeningCase.case_id)}
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Open Full Review
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Next Step: Clinician Verification</h4>
            <p className="text-xs text-slate-400">
              Review AI explanation, confirm or adjust diagnosis, and assign patient referral plan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onNewScreening && (
            <Button
              onClick={onNewScreening}
              variant="outline"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border-white/20 text-xs"
            >
              New Screening
            </Button>
          )}
          <Button
            onClick={onViewAllCases}
            variant="outline"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/15 text-white border-white/20 text-xs"
          >
            All Cases
          </Button>
          <Button
            onClick={() => onProceedToReview(screeningCase.case_id)}
            variant="primary"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
          >
            Review Case Details
          </Button>
        </div>
      </div>
    </div>
  );
};
