import React from 'react';
import {
  CheckCircle2,
  Camera,
  CheckSquare,
  Cpu,
  Eye,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';

export type WorkflowStepId = 'capture' | 'validate' | 'analyze' | 'explain' | 'action';

export interface WorkflowStep {
  id: WorkflowStepId;
  stepNumber: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'capture',
    stepNumber: '01',
    label: 'Capture',
    description: 'Patient context & image input',
    icon: <Camera className="w-4 h-4" />,
  },
  {
    id: 'validate',
    stepNumber: '02',
    label: 'Validate',
    description: 'Optical quality & heuristics',
    icon: <CheckSquare className="w-4 h-4" />,
  },
  {
    id: 'analyze',
    stepNumber: '03',
    label: 'Analyze',
    description: 'EfficientNet inference & confidence',
    icon: <Cpu className="w-4 h-4" />,
  },
  {
    id: 'explain',
    stepNumber: '04',
    label: 'Explain',
    description: 'Grad-CAM saliency mapping',
    icon: <Eye className="w-4 h-4" />,
  },
  {
    id: 'action',
    stepNumber: '05',
    label: 'Clinical Action',
    description: 'Screening priority & review',
    icon: <Stethoscope className="w-4 h-4" />,
  },
];

interface WorkflowIndicatorProps {
  currentStep: WorkflowStepId | number;
  completedSteps?: (WorkflowStepId | number)[];
  onStepClick?: (step: WorkflowStepId) => void;
  className?: string;
  variant?: 'full' | 'compact';
}

export const WorkflowIndicator: React.FC<WorkflowIndicatorProps> = ({
  currentStep,
  completedSteps = [],
  onStepClick,
  className = '',
  variant = 'full',
}) => {
  // Convert numeric index to step id if needed
  const getStepId = (step: WorkflowStepId | number): WorkflowStepId => {
    if (typeof step === 'number') {
      const ids: WorkflowStepId[] = ['capture', 'validate', 'analyze', 'explain', 'action'];
      return ids[Math.min(Math.max(0, step - 1), 4)];
    }
    return step;
  };

  const activeId = getStepId(currentStep);
  const activeIndex = WORKFLOW_STEPS.findIndex((s) => s.id === activeId);

  const isCompleted = (stepId: WorkflowStepId, index: number): boolean => {
    if (completedSteps.some((s) => getStepId(s) === stepId)) return true;
    return index < activeIndex;
  };

  return (
    <nav
      aria-label="Screening Workflow Progress"
      className={`bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-mono">
            Pipeline Flow
          </span>
          <span className="text-xs font-semibold text-slate-700">
            AI-Assisted Screening Sequence
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
          Step {activeIndex + 1} of 5: <strong className="text-slate-700">{WORKFLOW_STEPS[activeIndex]?.label}</strong>
        </span>
      </div>

      {/* Stepper track */}
      <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
        {WORKFLOW_STEPS.map((step, idx) => {
          const active = step.id === activeId;
          const done = isCompleted(step.id, idx);
          const isClickable = Boolean(onStepClick);

          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick && onStepClick(step.id)}
                className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col justify-between h-full ${
                  active
                    ? 'bg-teal-50/90 border-teal-500 shadow-xs ring-1 ring-teal-500/30'
                    : done
                    ? 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80'
                    : 'bg-white border-slate-200/60 opacity-60'
                } ${isClickable ? 'cursor-pointer hover:border-teal-400' : 'cursor-default'}`}
              >
                {/* Step Top: Number & Status Icon */}
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span
                    className={`font-mono text-xs font-bold ${
                      active
                        ? 'text-teal-700'
                        : done
                        ? 'text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.stepNumber}
                  </span>

                  <div>
                    {done ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    ) : active ? (
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shadow-xs animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-medium border border-slate-200">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Label */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        active
                          ? 'text-teal-950 font-extrabold'
                          : done
                          ? 'text-slate-800'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {variant === 'full' && (
                    <p
                      className={`text-[10px] mt-0.5 line-clamp-1 leading-tight ${
                        active
                          ? 'text-teal-800 font-medium'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
