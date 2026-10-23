import React from 'react';
import { ABCDEAssessment } from '../types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ABCDECardProps {
  abcde: ABCDEAssessment;
}

export const ABCDECard: React.FC<ABCDECardProps> = ({ abcde }) => {
  const items = [
    { key: 'A', title: 'Asymmetry', data: abcde.asymmetry, letterColor: 'bg-indigo-600 text-white' },
    { key: 'B', title: 'Border', data: abcde.border, letterColor: 'bg-teal-600 text-white' },
    { key: 'C', title: 'Color', data: abcde.color, letterColor: 'bg-sky-600 text-white' },
    { key: 'D', title: 'Diameter', data: abcde.diameter, letterColor: 'bg-amber-600 text-white' },
    { key: 'E', title: 'Evolution', data: abcde.evolution, letterColor: 'bg-rose-600 text-white' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-900">ABCDE Dermatological Criteria</h4>
          <p className="text-xs text-slate-500">Clinical semiotics feature breakdown</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Composite Suspicion</span>
          <span className={`text-sm font-bold ${abcde.total_suspicion_score > 0.5 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {(abcde.total_suspicion_score * 100).toFixed(0)}% Index
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isElevated = item.data.score >= 0.5;
          return (
            <div
              key={item.key}
              className={`p-3 rounded-lg border transition-all ${
                isElevated
                  ? 'bg-rose-50/40 border-rose-200/80'
                  : 'bg-slate-50/60 border-slate-200/70'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${item.letterColor}`}
                >
                  {item.key}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        isElevated ? 'text-rose-700' : 'text-slate-600'
                      }`}
                    >
                      {isElevated ? (
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      )}
                      {item.data.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 leading-snug">
                    {item.data.detail}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
