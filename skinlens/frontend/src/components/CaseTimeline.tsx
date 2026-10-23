import React from 'react';
import {
  UploadCloud,
  CheckCircle2,
  FileCheck,
  Cpu,
  Layers,
  AlertTriangle,
  Stethoscope,
  Send,
  Clock,
  ArrowDown,
  RotateCcw,
  Check,
} from 'lucide-react';
import { ScreeningCase, ScreeningPriority, SpecialistReferral } from '../types';

interface CaseTimelineProps {
  screeningCase: ScreeningCase;
  referral?: SpecialistReferral | null;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

interface TimelineStep {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'active' | 'pending' | 'flagged';
  icon: React.ReactNode;
  timestamp?: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'info' | 'urgent';
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({
  screeningCase,
  referral,
  className = '',
}) => {
  const isReviewed =
    screeningCase.status === 'Reviewed' ||
    Boolean(screeningCase.clinician_review);
  const isImageRetake =
    screeningCase.status === 'Better Image Requested' ||
    screeningCase.clinician_review?.action_type === 'retake_requested';
  const isReferred =
    screeningCase.status === 'Awaiting Specialist Review' ||
    Boolean(screeningCase.referral) ||
    Boolean(referral) ||
    screeningCase.clinician_review?.action_type === 'referred';

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const steps: TimelineStep[] = [
    {
      id: 'step-upload',
      name: 'Image Uploaded',
      description: `Dermoscopic photo ingested (${screeningCase.quality.resolution.width}×${screeningCase.quality.resolution.height}px)`,
      status: 'completed',
      icon: <UploadCloud className="w-4 h-4" />,
      timestamp: formatTime(screeningCase.created_at) || '10:14 AM',
      badge: 'Verified',
      badgeVariant: 'success',
    },
    {
      id: 'step-validate',
      name: 'Image Validated',
      description: `Optical quality: ${screeningCase.quality.quality_rating} (${screeningCase.quality.sharpness_score}% sharpness)`,
      status: 'completed',
      icon: <FileCheck className="w-4 h-4" />,
      timestamp: formatTime(screeningCase.created_at) || '10:14 AM',
      badge: screeningCase.quality.is_acceptable ? 'Optimal' : 'Sub-optimal',
      badgeVariant: screeningCase.quality.is_acceptable ? 'success' : 'warning',
    },
    {
      id: 'step-ai',
      name: 'AI Analysis',
      description: `${screeningCase.primary_diagnosis} (${(screeningCase.confidence * 100).toFixed(1)}% confidence)`,
      status: 'completed',
      icon: <Cpu className="w-4 h-4" />,
      timestamp: formatTime(screeningCase.created_at) || '10:15 AM',
      badge: 'Inference Complete',
      badgeVariant: 'info',
    },
    {
      id: 'step-gradcam',
      name: 'Grad-CAM Generated',
      description: 'Layer-4 convolutional attention heatmap rendered for pixel explainability',
      status: 'completed',
      icon: <Layers className="w-4 h-4" />,
      timestamp: formatTime(screeningCase.created_at) || '10:15 AM',
      badge: 'Heatmap Ready',
      badgeVariant: 'info',
    },
    {
      id: 'step-priority',
      name: 'Screening Priority',
      description: `Prototype Signal: ${screeningCase.screening_priority || screeningCase.triage_priority || 'Review Recommended'}`,
      status: 'completed',
      icon: <AlertTriangle className="w-4 h-4" />,
      timestamp: formatTime(screeningCase.created_at) || '10:15 AM',
      badge: screeningCase.screening_priority || 'Review Recommended',
      badgeVariant:
        (screeningCase.screening_priority || screeningCase.triage_priority) === 'Prompt Professional Evaluation' ||
        screeningCase.triage_priority === 'Urgent'
          ? 'urgent'
          : (screeningCase.screening_priority || screeningCase.triage_priority) === 'Review Recommended' ||
            screeningCase.triage_priority === 'Moderate'
          ? 'warning'
          : 'success',
    },
    {
      id: 'step-review',
      name: 'Clinician Review',
      description: isImageRetake
        ? 'Clinician requested higher resolution image retake with uniform illumination'
        : isReviewed
        ? `Reviewed by ${screeningCase.clinician_review?.reviewer_name || 'Attending Clinician'}`
        : 'Awaiting dermatologist review, attestation, and management decision',
      status: isImageRetake
        ? 'flagged'
        : isReviewed || isReferred
        ? 'completed'
        : 'active',
      icon: <Stethoscope className="w-4 h-4" />,
      timestamp: screeningCase.clinician_review?.reviewed_at
        ? formatTime(screeningCase.clinician_review.reviewed_at)
        : isReviewed
        ? 'Just now'
        : undefined,
      badge: isImageRetake
        ? 'Retake Requested'
        : isReviewed
        ? 'Attested'
        : 'Action Needed',
      badgeVariant: isImageRetake ? 'warning' : isReviewed ? 'success' : 'info',
    },
    {
      id: 'step-referral',
      name: 'Referral',
      description: isReferred
        ? `Referral Created • Status: Awaiting Specialist Review (${referral?.case_id || screeningCase.case_id})`
        : isReviewed
        ? 'Clinician determined routine follow-up / no external referral required'
        : 'Specialist referral order pending clinician review',
      status: isReferred ? 'completed' : isReviewed ? 'completed' : 'pending',
      icon: <Send className="w-4 h-4" />,
      timestamp: referral?.referred_at ? formatTime(referral.referred_at) : undefined,
      badge: isReferred
        ? 'Referral Created'
        : isReviewed
        ? 'Discharged'
        : 'Pending',
      badgeVariant: isReferred ? 'urgent' : isReviewed ? 'success' : 'info',
    },
  ];

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs ${className}`}
      data-testid="case-timeline"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Decision-Support Pipeline
            </span>
            <span className="text-xs font-mono font-bold text-slate-500">
              Case {screeningCase.case_id}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
            Clinical Decision-Support Case Timeline
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>7-Step Clinical Workflow</span>
        </div>
      </div>

      {/* The 7 Steps: Upload -> Validate -> AI Analysis -> Grad-CAM -> Priority -> Review -> Referral */}
      <div className="mt-6 space-y-2">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-4 group">
              {/* Vertical Step Connector Bar & Arrow */}
              {!isLast && (
                <div className="absolute left-4 top-8 -bottom-3 w-0.5 bg-slate-200 group-hover:bg-teal-300 transition-colors flex items-center justify-center pointer-events-none">
                  <ArrowDown className="w-2.5 h-2.5 text-slate-400" />
                </div>
              )}

              {/* Step Circle Status Indicator */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                  step.status === 'completed'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : step.status === 'active'
                    ? 'bg-amber-500 text-white border-amber-500 ring-4 ring-amber-100 animate-pulse'
                    : step.status === 'flagged'
                    ? 'bg-rose-500 text-white border-rose-500 ring-4 ring-rose-100'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                {step.status === 'completed' ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : step.status === 'flagged' ? (
                  <RotateCcw className="w-4 h-4" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pb-5 pt-0.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 font-mono">
                      0{index + 1}
                    </span>
                    <h4
                      className={`text-sm font-bold ${
                        step.status === 'pending'
                          ? 'text-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {step.name}
                    </h4>

                    {step.badge && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          step.badgeVariant === 'urgent'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : step.badgeVariant === 'warning'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : step.badgeVariant === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        {step.badge}
                      </span>
                    )}
                  </div>

                  {step.timestamp && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {step.timestamp}
                    </span>
                  )}
                </div>

                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    step.status === 'pending'
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
