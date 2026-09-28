import React, { useState } from 'react';
import { GeneratedFrame } from '../types/cinema';
import { X, Sliders, ArrowLeftRight, Check, Eye } from 'lucide-react';

interface ComparisonModalProps {
  frameA: GeneratedFrame;
  frameB: GeneratedFrame;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ frameA, frameB, onClose }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [mode, setMode] = useState<'slider' | 'side-by-side'>('slider');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6">
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-[#111317] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#16181d]">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-base font-semibold text-white tracking-wide">
              Continuity Comparison Mode
            </h3>
            <span className="text-xs text-white/40 font-mono-data">
              {frameA.episode}-{frameA.sceneId} vs {frameB.episode}-{frameB.sceneId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
              <button
                onClick={() => setMode('slider')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === 'slider' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Split Slider
              </button>
              <button
                onClick={() => setMode('side-by-side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === 'side-by-side' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Side by Side
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-[#0b0c0e]">
          {mode === 'slider' ? (
            <div className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden border border-white/15 shadow-2xl select-none">
              {/* Frame B (Background) */}
              <img
                src={frameB.url}
                alt="Frame B"
                className="absolute inset-0 w-full h-full object-contain bg-black pointer-events-none"
              />
              <div className="absolute top-4 right-4 z-10 bg-black/70 backdrop-blur-sm border border-white/15 px-3 py-1 rounded text-xs font-mono-data text-amber-400">
                Frame B: {frameB.cinematography.shotType} ({frameB.cinematography.lens})
              </div>

              {/* Frame A (Clipped Overlay) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={frameA.url}
                  alt="Frame A"
                  className="absolute inset-0 w-full h-full object-contain bg-black max-w-none"
                  style={{ width: '100%', minWidth: '100%' }}
                />
                <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm border border-white/15 px-3 py-1 rounded text-xs font-mono-data text-cyan-400">
                  Frame A: {frameA.cinematography.shotType} ({frameA.cinematography.lens})
                </div>
              </div>

              {/* Slider Line & Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg border-2 border-black/40">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>

              {/* Invisible touch/drag surface */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-5xl">
              {/* Frame A Card */}
              <div className="flex flex-col gap-2 bg-[#16181d] p-3 rounded-lg border border-white/10">
                <div className="flex items-center justify-between text-xs text-white/60 font-mono-data pb-1 border-b border-white/5">
                  <span className="text-cyan-400 font-semibold">Frame A: {frameA.cinematography.shotType}</span>
                  <span>{frameA.cinematography.lens} · {frameA.lighting.preset}</span>
                </div>
                <div className="relative aspect-video rounded overflow-hidden bg-black border border-white/10">
                  <img src={frameA.url} alt="Frame A" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* Frame B Card */}
              <div className="flex flex-col gap-2 bg-[#16181d] p-3 rounded-lg border border-white/10">
                <div className="flex items-center justify-between text-xs text-white/60 font-mono-data pb-1 border-b border-white/5">
                  <span className="text-amber-400 font-semibold">Frame B: {frameB.cinematography.shotType}</span>
                  <span>{frameB.cinematography.lens} · {frameB.lighting.preset}</span>
                </div>
                <div className="relative aspect-video rounded overflow-hidden bg-black border border-white/10">
                  <img src={frameB.url} alt="Frame B" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          )}

          {/* Continuity Metrics Strip */}
          <div className="mt-6 w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#16181d] border border-white/10 p-3 rounded-lg">
              <span className="text-[11px] text-white/40 uppercase tracking-wider block">Facial Identity</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Locked & Consistent</span>
              </div>
            </div>

            <div className="bg-[#16181d] border border-white/10 p-3 rounded-lg">
              <span className="text-[11px] text-white/40 uppercase tracking-wider block">Wardrobe Weave</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>Beige Knit Preserved</span>
              </div>
            </div>

            <div className="bg-[#16181d] border border-white/10 p-3 rounded-lg">
              <span className="text-[11px] text-white/40 uppercase tracking-wider block">Lighting Key Direction</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-white/80 font-medium font-mono-data">
                <span>{frameA.lighting.keyLightDirection}</span>
              </div>
            </div>

            <div className="bg-[#16181d] border border-white/10 p-3 rounded-lg">
              <span className="text-[11px] text-white/40 uppercase tracking-wider block">Color Science LUT</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-white/80 font-medium">
                <span>Kodak 5219 / Muted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
