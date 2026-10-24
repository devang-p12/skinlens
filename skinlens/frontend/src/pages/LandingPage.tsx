import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Eye,
  Flame,
  FlaskConical,
  Layers,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Button } from '../components/Button';

interface LandingPageProps {
  onGetStarted: () => void;
  onLoadDemo: () => void;
}

const TECH_STATS = [
  { value: 'EfficientNet-B0', label: 'Neural Architecture', icon: Brain },
  { value: '7 Classes', label: 'Lesion Categories', icon: Layers },
  { value: 'HAM10000', label: 'Training Dataset', icon: FlaskConical },
  { value: 'Grad-CAM', label: 'Explainability Engine', icon: Eye },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Patient Intake',
    desc: 'Register demographics, lesion location, duration, and clinical observations.',
    icon: Stethoscope,
    color: 'teal',
  },
  {
    step: '02',
    title: 'Image Validation',
    desc: 'Automated optical quality check — sharpness, contrast, and resolution assessment.',
    icon: ShieldCheck,
    color: 'sky',
  },
  {
    step: '03',
    title: 'AI Classification',
    desc: 'Real EfficientNet-B0 inference produces a softmax probability vector over 7 lesion classes.',
    icon: Cpu,
    color: 'violet',
  },
  {
    step: '04',
    title: 'Grad-CAM Explainability',
    desc: 'Gradient-weighted saliency maps visually highlight the pixel regions driving the AI prediction.',
    icon: Flame,
    color: 'orange',
  },
  {
    step: '05',
    title: 'Screening Priority',
    desc: 'Prototype triage logic produces a non-diagnostic screening signal: Routine / Review / Prompt Evaluation.',
    icon: TrendingUp,
    color: 'amber',
  },
  {
    step: '06',
    title: 'Clinician Review',
    desc: 'Clinician attests findings, logs review notes, and takes action — mark reviewed, request retake, or refer.',
    icon: CheckCircle2,
    color: 'emerald',
  },
];

const LESION_CLASSES = [
  { code: 'MEL', name: 'Melanoma', risk: 'High', color: 'rose' },
  { code: 'BCC', name: 'Basal Cell Carcinoma', risk: 'Moderate', color: 'orange' },
  { code: 'AKIEC', name: 'Actinic Keratosis', risk: 'Moderate', color: 'amber' },
  { code: 'BKL', name: 'Benign Keratosis', risk: 'Low', color: 'emerald' },
  { code: 'DF', name: 'Dermatofibroma', risk: 'Low', color: 'teal' },
  { code: 'NV', name: 'Melanocytic Nevus', risk: 'Low', color: 'sky' },
  { code: 'VASC', name: 'Vascular Lesion', risk: 'Low', color: 'violet' },
];

// Animated counter hook
function useCountUp(target: number, duration = 1500, delay = 0) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const step = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return count;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLoadDemo }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const acc = useCountUp(91, 1800, 400);
  const classes = useCountUp(7, 1200, 600);
  const time = useCountUp(320, 1400, 800);

  return (
    <div
      className={`space-y-0 transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-[#0a2a2a] to-slate-950 text-white mb-8 border border-slate-800/60 shadow-2xl">
        {/* Ambient orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-400/3 rounded-full blur-3xl pointer-events-none" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(13,148,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-14 sm:py-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/25 text-xs font-bold tracking-wide mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Research / Ideathon Prototype · Not for Clinical Use
          </div>

          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mb-6">
            <span className="text-white">Explainable AI</span>
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              Skin Lesion Screening
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
            SkinLens is a clinical decision-support prototype that combines real{' '}
            <strong className="text-teal-300">EfficientNet-B0</strong> neural inference,{' '}
            <strong className="text-emerald-300">Grad-CAM visual explainability</strong>, and a
            human-in-the-loop clinician workflow — from image upload to specialist referral.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={onGetStarted}
              className="group flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm transition-all duration-200 shadow-lg shadow-teal-500/25 hover:shadow-teal-400/35 hover:scale-[1.02] active:scale-100"
            >
              <PlusCircle className="w-5 h-5" />
              Start New Screening
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onLoadDemo}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/8 hover:bg-white/12 text-white font-semibold text-sm border border-white/15 hover:border-white/25 transition-all duration-200 backdrop-blur-sm"
            >
              View Demo Cases
            </button>
          </div>

          {/* Live stats bar */}
          <div className="mt-10 pt-6 border-t border-white/8 grid grid-cols-3 gap-6 max-w-lg">
            <div>
              <div className="text-2xl font-black text-white font-mono">
                {acc}
                <span className="text-teal-400">%</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">HAM10000 Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">{classes}</div>
              <div className="text-xs text-slate-400 mt-0.5">Lesion Classes</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">
                {time}
                <span className="text-teal-400 text-base">ms</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Avg Inference</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          TECH STACK STRIP
      ───────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {TECH_STATS.map(({ value, label, icon: Icon }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3 hover:border-teal-300 hover:shadow-sm transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100">
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 leading-none">{value}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          6-STEP WORKFLOW
      ───────────────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">How SkinLens Works</h2>
            <p className="text-sm text-slate-500 mt-0.5">End-to-end from image capture to clinical action</p>
          </div>
          <span className="text-xs font-mono text-slate-400 hidden sm:block">
            6-Step Decision Support Pipeline
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKFLOW_STEPS.map(({ step, title, desc, icon: Icon, color }) => (
            <div
              key={step}
              className="group bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all duration-200 cursor-default"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    color === 'teal'
                      ? 'bg-teal-50 text-teal-700 border-teal-100'
                      : color === 'sky'
                      ? 'bg-sky-50 text-sky-700 border-sky-100'
                      : color === 'violet'
                      ? 'bg-violet-50 text-violet-700 border-violet-100'
                      : color === 'orange'
                      ? 'bg-orange-50 text-orange-700 border-orange-100'
                      : color === 'amber'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-black font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {step}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          7 LESION CLASSES
      ───────────────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-extrabold text-white">
                7 Dermatological Classes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                EfficientNet-B0 trained on HAM10000 — International Skin Imaging Collaboration
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/25 uppercase tracking-wide">
              Real Inference
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {LESION_CLASSES.map(({ code, name, risk, color }) => (
              <div
                key={code}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <span
                  className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md mb-2 ${
                    risk === 'High'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                      : risk === 'Moderate'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                  }`}
                >
                  {code}
                </span>
                <p className="text-[11px] text-slate-300 font-semibold leading-tight">{name}</p>
                <span
                  className={`text-[10px] mt-1.5 font-medium ${
                    risk === 'High'
                      ? 'text-rose-400'
                      : risk === 'Moderate'
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                >
                  {risk} Risk
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          GRAD-CAM EXPLAINABILITY CALLOUT
      ───────────────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Grad-CAM feature */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/25 flex items-center justify-center">
                  <Eye className="w-4.5 w-[18px] h-[18px]" />
                </div>
                <h3 className="text-sm font-bold text-white">Grad-CAM Visual Explainability</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                SkinLens generates real gradient-weighted class activation maps from the{' '}
                <strong className="text-slate-300">EfficientNet-B0 final convolutional layer</strong>. 
                The heatmap reveals exactly which pixel regions of the dermoscopic image drove the AI classification decision.
              </p>
              <div className="space-y-2">
                {[
                  'Interactive split-curtain drag comparison',
                  'Side-by-side, overlay, and heatmap-only modes',
                  'Color spectrum: blue (low) → yellow → red (peak activation)',
                  'Real gradients from PyTorch autograd — not synthetic',
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 italic">
                "Grad-CAM is an interpretability aid for clinician inspection, not a diagnostic conclusion."
              </span>
            </div>
          </div>

          {/* Non-diagnostic disclaimer + CTA */}
          <div className="flex flex-col gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex-1">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1.5">Non-Diagnostic Prototype</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    SkinLens is a <strong>research and ideathon prototype</strong>. All AI predictions, 
                    screening priorities, and Grad-CAM visualizations are decision-support signals 
                    only. They do not constitute clinical diagnoses or replace the judgment of a 
                    licensed medical professional.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-1">Ready to see it in action?</h4>
              <p className="text-xs text-slate-500 mb-4">
                Start a new patient screening with your own image, or explore the pre-loaded 
                demonstration cases in the clinical registry.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={onGetStarted}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  New Screening
                </button>
                <button
                  onClick={onLoadDemo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Browse Cases
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          BOTTOM DISCLAIMER STRIP
      ───────────────────────────────────────────────────────────────── */}
      <section className="pb-8">
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 text-center">
          <strong className="text-slate-700">SkinLens</strong> — An AI-assisted dermatological screening 
          prototype built for research and demonstration purposes. EfficientNet-B0 model weights sourced from 
          Hugging Face. Training data: HAM10000 (ISIC Archive). Not validated for clinical deployment.{' '}
          <strong className="text-amber-700">Not intended for clinical diagnosis.</strong>
        </div>
      </section>
    </div>
  );
};
