import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Camera } from 'lucide-react';
import { ImageQualityResult } from '../types';

interface QualityIndicatorProps {
  quality: ImageQualityResult;
  compact?: boolean;
}

export const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  quality,
  compact = false,
}) => {
  const hasIssues = !quality.is_acceptable || (quality.issues && quality.issues.length > 0);

  if (compact) {
    if (hasIssues) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Quality Warning
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Quality Verified
      </span>
    );
  }

  // If there are warnings or issues, show clear actionable guidance
  if (hasIssues) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-950">Image Quality Notice</span>
          <p className="text-amber-800 leading-relaxed">
            {quality.issues.join(' • ') || 'Image optical fidelity is sub-optimal. Recapture recommended with uniform lighting and direct focal alignment.'}
          </p>
        </div>
      </div>
    );
  }

  // Clean, minimal verified status
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      <span>Image Quality: Verified for clinical screening</span>
    </div>
  );
};

