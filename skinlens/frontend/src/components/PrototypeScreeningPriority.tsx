import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Info,
  Sparkles,
} from 'lucide-react';
import { ScreeningPriority } from '../types';

interface PrototypeScreeningPriorityProps {
  prediction: string;
  confidence: number;
  priority?: ScreeningPriority;
  className?: string;
  showExplanationDetails?: boolean;
}

export function computeScreeningPriority(
  prediction: string,
  confidence: number
): ScreeningPriority {
  const normPred = (prediction || '').toLowerCase();

  // High acuity lesion classes (e.g. Melanoma / MEL)
  if (normPred.includes('melanoma') || normPred === 'mel') {
    // If exceptionally high certainty (>= 90%)
    if (confidence >= 0.90) {
      return 'Prompt Professional Evaluation';
    }
    // E.g. Melanoma with 87.2% confidence -> Review Recommended
    return 'Review Recommended';
  }

  // Non-melanoma cutaneous carcinomas (BCC, SCC)
  if (
    normPred.includes('basal') ||
    normPred === 'bcc' ||
    normPred.includes('squamous') ||
    normPred.includes('carcinoma')
  ) {
    if (confidence >= 0.88) {
      return 'Prompt Professional Evaluation';
    }
    return 'Review Recommended';
  }

  // Pre-malignant dysplasia / actinic lesions
  if (
    normPred.includes('actinic') ||
    normPred === 'akiec' ||
    normPred.includes('bowen')
  ) {
    return 'Review Recommended';
  }

  // Benign lesion types (Nevus, Benign Keratosis, Dermatofibroma, Vascular)
  if (
    normPred.includes('nevus') ||
    normPred === 'nv' ||
    normPred.includes('keratosis') ||
    normPred === 'bkl' ||
    normPred === 'df' ||
    normPred === 'vasc'
  ) {
    if (confidence >= 0.80) {
      return 'Routine Follow-up';
    }
    return 'Review Recommended';
  }

  return 'Review Recommended';
}

export const PrototypeScreeningPriority: React.FC<PrototypeScreeningPriorityProps> = ({
  prediction,
  confidence,
  priority: customPriority,
  className = '',
  showExplanationDetails = true,
}) => {
  const priority = customPriority || computeScreeningPriority(prediction, confidence);
  const confidencePercent = (confidence * 100).toFixed(1);

  const getPriorityConfig = () => {
    switch (priority) {
      case 'Prompt Professional Evaluation':
        return {
          containerClass:
            'bg-rose-50/80 border-rose-300 text-rose-950 shadow-xs ring-1 ring-rose-200',
          badgeClass:
            'bg-rose-600 text-white font-extrabold shadow-sm',
          chipClass: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
          accentText: 'text-rose-700',
          guidance:
            'Lesion features warrant prompt in-person dermatologic evaluation. AI model observed atypical morphological activation.',
        };
      case 'Review Recommended':
        return {
          containerClass:
            'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs ring-1 ring-amber-200',
          badgeClass:
            'bg-amber-500 text-white font-extrabold shadow-sm',
          chipClass: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          accentText: 'text-amber-700',
          guidance:
            'Professional clinician review advised to assess dermoscopic context, patient history, and evolution.',
        };
      case 'Routine Follow-up':
      default:
        return {
          containerClass:
            'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs ring-1 ring-emerald-200',
          badgeClass:
            'bg-emerald-600 text-white font-extrabold shadow-sm',
          chipClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          accentText: 'text-emerald-700',
          guidance:
            'Regular surveillance indicated. Patient can continue scheduled periodic skin self-checks.',
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-all ${config.containerClass} ${className}`}
      data-testid="prototype-screening-priority"
    >
      {/* Section Header with Clearly Labeled Title & Prototype Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono">
              PROTOTYPE SCREENING PRIORITY
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 text-slate-700 border border-black/10">
              Experimental Decision-Support
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Algorithmic triage indicator derived from neural inference and calibrated confidence
          </p>
        </div>

        {/* Highlighted Screening Priority Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-black/10 bg-white/90 backdrop-blur-sm shadow-xs">
            {config.icon}
            <span className="text-xs font-semibold text-slate-500">Screening Priority:</span>
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-extrabold ${config.badgeClass}`}>
              {priority}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5">
        {/* AI Prediction */}
        <div className="bg-white/95 rounded-xl p-4 border border-black/5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            AI Prediction
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900 mt-1 block tracking-tight">
            {prediction}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Neural classification label
          </span>
        </div>

        {/* Confidence */}
        <div className="bg-white/95 rounded-xl p-4 border border-black/5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Confidence
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-black text-teal-600 font-mono">
              {confidencePercent}%
            </span>
            <span className="text-xs text-slate-400">Softmax calibrated</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-teal-500 rounded-full"
              style={{ width: `${Math.min(100, confidence * 100)}%` }}
            />
          </div>
        </div>

        {/* Screening Priority */}
        <div className="bg-white/95 rounded-xl p-4 border border-black/5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Screening Priority
          </span>
          <span className={`text-base sm:text-lg font-black mt-1 block ${config.accentText}`}>
            {priority}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Triage review queue signal
          </span>
        </div>
      </div>

      {/* Required Explanation & Disclaimer Statements */}
      <div className="space-y-2 pt-3 border-t border-black/10 text-xs">
        {/* Exact required explanation */}
        <div className="flex items-start gap-2 bg-white/80 p-3 rounded-xl border border-black/5 text-slate-800">
          <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">
              "This is an AI-assisted screening signal intended to support professional review."
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {config.guidance}
            </p>
          </div>
        </div>

        {/* Non-clinical validation notice */}
        {showExplanationDetails && (
          <div className="text-[11px] text-slate-500 bg-black/5 p-2.5 rounded-lg flex items-center gap-2">
            <span className="font-bold text-slate-700">Prototype Logic:</span>
            <span>
              This priority mapping uses prototype heuristics and is NOT presented as clinically validated. It serves exclusively as decision-support for human clinicians.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
