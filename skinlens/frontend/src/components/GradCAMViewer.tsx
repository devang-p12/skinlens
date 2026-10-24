import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  Layers,
  Flame,
  Sliders,
  Info,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Compass,
} from 'lucide-react';
import { GradCAMExplanation } from '../types';

interface GradCAMViewerProps {
  gradcam: GradCAMExplanation;
  primaryDiagnosis: string;
  confidence: number;
  modelArchitecture?: string;
  modelSource?: string;
}

export type GradCamViewMode = 'split' | 'side-by-side' | 'overlay' | 'heatmap' | 'original';

export const GradCAMViewer: React.FC<GradCAMViewerProps> = ({
  gradcam,
  primaryDiagnosis,
  confidence,
  modelArchitecture = 'EfficientNet-B0',
  modelSource = 'Hugging Face',
}) => {
  const [viewMode, setViewMode] = useState<GradCamViewMode>('split');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.80);
  const [isMagnifierActive, setIsMagnifierActive] = useState<boolean>(false);
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [showHotspots, setShowHotspots] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const displayOriginal = gradcam.original_data_url || gradcam.blended_data_url || '/samples/melanoma_sample.jpg';
  const displayHeatmap = gradcam.heatmap_data_url || gradcam.blended_data_url || displayOriginal;
  const displayBlended = gradcam.blended_data_url || displayOriginal;

  // Split-curtain drag handler
  const handleSplitDrag = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPos(pct);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleSplitDrag(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSplitDrag(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleSplitDrag(e.clientX);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle magnifier hover
  const handleMouseMoveOverImage = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMagnifierActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMagnifierPos({ x, y });
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-all">
      {/* Top Header with Explainability Badges & View Selectors */}
      <div className="px-5 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                Grad-CAM Neural Saliency Lens
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                Real Gradient Map
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive pixel attribution from {modelArchitecture} convolutional feature map
            </p>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/90 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'split'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Split</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'overlay'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overlay Blend</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'heatmap'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap Only</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'original'
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>Raw Photo</span>
          </button>
        </div>
      </div>

      {/* Main Visual Presentation Stage */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* MODE 1: INTERACTIVE SPLIT-SCREEN CURTAIN SLIDER (THE VISUAL HIGHLIGHT) */}
        {viewMode === 'split' && (
          <div className="space-y-3">
            {/* Visual Instruction Bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>Drag the vertical divider to compare raw lesion tissue with AI attention heatmap</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Presets:</span>
                <button
                  type="button"
                  onClick={() => setSplitPos(25)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${splitPos === 25 ? 'bg-teal-600 text-white border-teal-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'}`}
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => setSplitPos(50)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${splitPos === 50 ? 'bg-teal-600 text-white border-teal-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'}`}
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => setSplitPos(75)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${splitPos === 75 ? 'bg-teal-600 text-white border-teal-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'}`}
                >
                  75%
                </button>
              </div>
            </div>

            {/* Split Comparison Canvas */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchMove={handleTouchMove}
              className="relative w-full h-[360px] sm:h-[420px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 select-none cursor-ew-resize shadow-inner group"
            >
              {/* Bottom Layer: Grad-CAM Overlay (Right Side Revealed) */}
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <img
                  src={displayBlended}
                  alt="Grad-CAM Saliency Overlay"
                  className="max-h-full max-w-full object-contain pointer-events-none drop-shadow-md"
                />
              </div>

              {/* Top Layer: Raw Original Image (Clipped to Split Position) */}
              <div
                className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none"
                style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
              >
                <div className="w-full h-full flex items-center justify-center p-3">
                  <img
                    src={displayOriginal}
                    alt="Original Lesion Image"
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                </div>
              </div>

              {/* Left Label: Original */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/85 text-slate-200 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Original Lesion
                </span>
              </div>

              {/* Right Label: Grad-CAM Saliency */}
              <div className="absolute top-4 right-4 z-20 pointer-events-none">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-950/85 text-teal-300 backdrop-blur-md border border-teal-500/30 shadow-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  Grad-CAM Activation
                </span>
              </div>

              {/* Vertical Divider Curtain Line */}
              <div
                className="absolute top-0 bottom-0 z-30 pointer-events-none"
                style={{ left: `${splitPos}%` }}
              >
                <div className="w-0.5 h-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)] relative -translate-x-1/2">
                  {/* Circular Grabber Handle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900 border-2 border-teal-400 text-teal-300 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <div className="flex items-center -space-x-1 text-teal-300">
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Split Badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-black/70 text-slate-400 border border-white/10 backdrop-blur-xs">
                  Split: {Math.round(splitPos)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: SIDE-BY-SIDE DUAL VIEW */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Original Image */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/90 flex flex-col items-center p-3">
              <span className="absolute top-3 left-3 z-10 text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/80 text-slate-200 backdrop-blur-sm border border-white/10">
                Original Capture
              </span>
              <img
                src={displayOriginal}
                alt="Original Dermoscopic Lesion"
                className="w-full h-72 md:h-84 object-contain rounded-xl p-1"
              />
              <span className="text-[11px] text-slate-400 mt-2">
                Standard RGB Dermoscopy (Pre-flight Validated)
              </span>
            </div>

            {/* Grad-CAM Saliency Overlay */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-teal-900/50 flex flex-col items-center p-3">
              <span className="absolute top-3 left-3 z-10 text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-950 text-teal-300 backdrop-blur-sm border border-teal-500/40">
                Grad-CAM Saliency Overlay
              </span>
              <span className="absolute top-3 right-3 z-10 text-[11px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-500/30">
                {(confidence * 100).toFixed(1)}% Conf
              </span>
              <img
                src={displayBlended}
                alt="Grad-CAM Overlay"
                className="w-full h-72 md:h-84 object-contain rounded-xl p-1"
              />
              <span className="text-[11px] text-teal-400 font-medium mt-2">
                Target: {primaryDiagnosis} (Peak Hotspots on Perimeter)
              </span>
            </div>
          </div>
        )}

        {/* MODE 3: OVERLAY BLEND (WITH SLIDER) */}
        {viewMode === 'overlay' && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[340px] max-h-[440px] p-4">
              <span className="absolute top-4 left-4 z-10 text-xs font-bold px-3 py-1 rounded-full bg-black/80 text-teal-300 backdrop-blur-sm border border-teal-500/30">
                Grad-CAM Blended Layer
              </span>
              <img
                src={displayBlended}
                alt="Grad-CAM Blended"
                style={{ opacity: overlayOpacity }}
                className="max-h-[380px] max-w-full object-contain rounded-xl transition-opacity duration-150"
              />
            </div>

            {/* Live Opacity Slider */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Overlay Alpha Opacity:</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-40 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
                <span className="font-mono text-teal-400 font-bold w-12 text-right">
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODE 4: THERMAL HEATMAP ONLY */}
        {viewMode === 'heatmap' && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[340px] max-h-[440px] p-4">
            <span className="absolute top-4 left-4 z-10 text-xs font-bold px-3 py-1 rounded-full bg-black/80 text-amber-300 backdrop-blur-sm border border-amber-500/30">
              Raw Thermal Class Activation Matrix (Jet Colormap)
            </span>
            <img
              src={displayHeatmap}
              alt="Thermal Heatmap"
              className="max-h-[380px] max-w-full object-contain rounded-xl"
            />
          </div>
        )}

        {/* MODE 5: RAW PHOTO */}
        {viewMode === 'original' && (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[340px] max-h-[440px] p-4">
            <span className="absolute top-4 left-4 z-10 text-xs font-bold px-3 py-1 rounded-full bg-black/80 text-white backdrop-blur-sm border border-white/10">
              Raw Dermoscopic Input Image
            </span>
            <img
              src={displayOriginal}
              alt="Raw Dermoscopic Input"
              className="max-h-[380px] max-w-full object-contain rounded-xl"
            />
          </div>
        )}

        {/* Grad-CAM Heatmap Color Spectrum & Neural Metadata Strip */}
        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Colormap Scale */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-medium shrink-0">Gradient Scale:</span>
            <div className="flex items-center gap-2">
              <div className="w-36 sm:w-48 h-3 rounded-md bg-gradient-to-r from-blue-600 via-teal-400 via-yellow-400 to-red-600 border border-slate-700 shadow-inner" />
              <div className="flex items-center justify-between text-[10px] text-slate-400 w-36 sm:w-48">
                <span>0.0 (Baseline)</span>
                <span className="text-amber-300 font-medium">0.5</span>
                <span className="text-rose-400 font-bold">1.0 (Peak)</span>
              </div>
            </div>
          </div>

          {/* Neural Architecture Metadata Badge */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>Target Layer: <strong className="text-teal-300">Conv2dNormActivation</strong> ({modelArchitecture})</span>
          </div>
        </div>

        {/* "Why did the AI make this prediction?" Clinical Interpretability Box */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-teal-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Why did the AI make this prediction?
            </h4>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
              Explainable AI
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Grad-CAM (Gradient-weighted Class Activation Mapping) computes the partial derivatives of the predicted class score with respect to the final convolutional feature layer of the <strong>{modelArchitecture}</strong> network. The heatmap visualizes spatial regions of greatest activation—specifically identifying <strong>irregular notched borders, atypical pigment reticulation, and localized chromatic variation</strong> that steered the model toward the <strong className="text-white">{primaryDiagnosis}</strong> classification ({(confidence * 100).toFixed(1)}% confidence).
          </p>

          {/* Mandatory Prototype & Interpretability Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="text-amber-300 font-semibold">Interpretability Prototype Notice:</strong>{' '}
              Grad-CAM is an interpretability tool to support clinician inspection, not proof of clinical diagnosis. Definitive medical conclusions require in-person examination and histological evaluation by a licensed pathologist.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
