import React, { useState } from 'react';
import { Eye, Layers, Flame, Sliders, Info, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { GradCAMExplanation } from '../types';

interface GradCAMViewerProps {
  gradcam: GradCAMExplanation;
  primaryDiagnosis: string;
  confidence: number;
  modelArchitecture?: string;
  modelSource?: string;
}

export const GradCAMViewer: React.FC<GradCAMViewerProps> = ({
  gradcam,
  primaryDiagnosis,
  confidence,
  modelArchitecture = 'EfficientNet-B0',
  modelSource = 'Hugging Face',
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'original' | 'heatmap' | 'overlay'>('side-by-side');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);

  const displayOriginal = gradcam.original_data_url || gradcam.blended_data_url;
  const displayHeatmap = gradcam.heatmap_data_url || gradcam.blended_data_url;
  const displayBlended = gradcam.blended_data_url || displayOriginal;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Top Bar with Mode Selectors */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              Grad-CAM Explainable AI Saliency
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {modelArchitecture} • {modelSource}
              </span>
            </h4>
            <p className="text-xs text-slate-400">Real Gradient-Weighted Class Activation Mapping</p>
          </div>
        </div>

        {/* View Mode Buttons */}
        <div className="inline-flex p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Side-by-Side
          </button>
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'original'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Original
          </button>
          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'heatmap'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Heatmap
          </button>
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'overlay'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Overlay
          </button>
        </div>
      </div>

      {/* Main Visual Display Area */}
      <div className="p-5">
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Image Panel */}
            <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center">
              <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold px-2.5 py-1 rounded bg-black/80 text-slate-200 backdrop-blur-sm border border-white/10">
                Original Image
              </span>
              <img
                src={displayOriginal}
                alt="Original Lesion Image"
                className="w-full h-72 md:h-80 object-contain p-2"
              />
            </div>

            {/* Grad-CAM Overlay Panel */}
            <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center">
              <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold px-2.5 py-1 rounded bg-black/80 text-teal-300 backdrop-blur-sm border border-teal-500/30">
                Grad-CAM Overlay
              </span>
              <span className="absolute top-3 right-3 z-10 text-[11px] font-medium px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-500/30">
                Confidence: {(confidence * 100).toFixed(1)}%
              </span>
              <img
                src={displayBlended}
                alt="Grad-CAM Overlay Image"
                className="w-full h-72 md:h-80 object-contain p-2"
              />
            </div>
          </div>
        )}

        {viewMode === 'original' && (
          <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[320px] max-h-[440px] p-2">
            <span className="absolute top-3 left-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-md bg-black/80 text-white backdrop-blur-sm border border-white/10">
              Raw Original Image
            </span>
            <img
              src={displayOriginal}
              alt="Raw Clinical Image"
              className="max-h-[400px] max-w-full object-contain"
            />
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[320px] max-h-[440px] p-2">
            <span className="absolute top-3 left-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-md bg-black/80 text-amber-300 backdrop-blur-sm border border-amber-500/30">
              Thermal Class Activation Heatmap
            </span>
            <img
              src={displayHeatmap}
              alt="Grad-CAM Heatmap"
              className="max-h-[400px] max-w-full object-contain"
            />
          </div>
        )}

        {viewMode === 'overlay' && (
          <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[320px] max-h-[440px] p-2">
            <span className="absolute top-3 left-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-md bg-black/80 text-teal-300 backdrop-blur-sm border border-teal-500/30">
              Grad-CAM Blended Overlay
            </span>
            <img
              src={displayBlended}
              alt="Grad-CAM Overlay"
              style={{ opacity: overlayOpacity }}
              className="max-h-[400px] max-w-full object-contain transition-opacity duration-150"
            />
          </div>
        )}

        {/* Heatmap Legend */}
        <div className="mt-3 flex items-center justify-between px-3.5 py-2 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Activation Scale:</span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-400">Baseline (0.0)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ml-1.5" />
              <span className="text-slate-400">Moderate (0.5)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-1.5" />
              <span className="text-amber-300 font-medium">High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 ml-1.5" />
              <span className="text-rose-400 font-semibold">Peak Activation (1.0)</span>
            </div>
          </div>

          {viewMode === 'overlay' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Overlay Opacity:</span>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <span className="text-teal-400 font-mono text-[11px]">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* "Why did the AI make this prediction?" Section */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div>
            <h5 className="text-sm font-bold text-teal-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Why did the AI make this prediction?
            </h5>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              Grad-CAM (Gradient-weighted Class Activation Mapping) calculates the gradients of the predicted class score with respect to the final convolutional feature layer (<code className="text-teal-300 bg-slate-900 px-1 py-0.5 rounded font-mono text-[11px]">Conv2dNormActivation</code>) of the {modelArchitecture} model. The heatmap highlights spatial regions and morphological features (such as pigment network disruption, border scalloping, or vascular arborization) that contributed most heavily to the <strong>{primaryDiagnosis}</strong> classification.
            </p>
          </div>

          {/* Mandatory Clinical Disclaimer */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="text-amber-300 font-semibold">Interpretability Disclaimer:</strong>{' '}
              Grad-CAM is an interpretability aid and does not prove clinical correctness. Final diagnosis requires histological confirmation by a licensed pathologist or dermatologist.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
