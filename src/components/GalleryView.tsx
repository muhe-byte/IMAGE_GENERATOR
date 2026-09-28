import React, { useState } from 'react';
import { Project, GeneratedFrame, Scene } from '../types/cinema';
import { Images, Lock, Download, Eye, Sliders, Filter, Check, Camera, Film } from 'lucide-react';

interface GalleryViewProps {
  project: Project;
  onSelectScene: (scene: Scene) => void;
  onSetMasterFrame: (frame: GeneratedFrame) => void;
  onCompareFrames: (frameA: GeneratedFrame, frameB: GeneratedFrame) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  project,
  onSelectScene,
  onSetMasterFrame,
  onCompareFrames,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'master' | string>('all');
  const [selectedFrame, setSelectedFrame] = useState<GeneratedFrame | null>(null);

  const filteredFrames = project.generatedFrames.filter((frame) => {
    if (filterType === 'master') return frame.isMasterFrame;
    if (filterType !== 'all') return frame.sceneId === filterType;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#090a0d] p-6 lg:p-8 space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Images className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Cinematic Production Gallery
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Complete archive of generated takes, optical variations, and locked master frames for "{project.title}".
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 bg-[#12141a] p-1.5 rounded-lg border border-white/10">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'all' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            All Takes ({project.generatedFrames.length})
          </button>
          <button
            onClick={() => setFilterType('master')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filterType === 'master'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Master Frames Only</span>
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFrames.map((frame) => {
          const scene = project.scenes.find((s) => s.id === frame.sceneId);
          return (
            <div
              key={frame.id}
              className="bg-[#12141c] border border-white/10 rounded-xl overflow-hidden shadow-lg group hover:border-amber-500/40 transition-all flex flex-col"
            >
              {/* Image Frame */}
              <div
                onClick={() => setSelectedFrame(frame)}
                className="relative aspect-video bg-black cursor-pointer overflow-hidden"
              >
                <img
                  src={frame.url}
                  alt={scene?.title || 'Cinema Frame'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Master Badge */}
                {frame.isMasterFrame && (
                  <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-sm border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-mono-data text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>MASTER FRAME</span>
                  </div>
                )}

                {/* Slate Overlay */}
                <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono-data text-white/90 border border-white/10">
                  {frame.episode}-{frame.sceneId} · {frame.cinematography.shotType.split(' ')[0]}
                </div>

                <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono-data text-amber-300 border border-white/10">
                  {frame.cinematography.lens}
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-white truncate">{scene?.title}</h4>
                  <div className="text-[11px] text-white/40 mt-1 font-mono-data">
                    {frame.lighting.preset} · {frame.aspectRatio}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    onClick={() => onSetMasterFrame(frame)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
                      frame.isMasterFrame
                        ? 'text-amber-400 bg-amber-500/10 font-medium'
                        : 'text-white/40 hover:text-white bg-white/5'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>{frame.isMasterFrame ? 'Locked Master' : 'Set Master'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {scene && (
                      <button
                        onClick={() => onSelectScene(scene)}
                        className="p-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                        title="Open in Workspace"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <a
                      href={frame.url}
                      download={`${frame.episode}-${frame.sceneId}-frame.png`}
                      className="p-1.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                      title="Download PNG"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Frame Detail Inspector Modal */}
      {selectedFrame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#111319] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#161822]">
              <div className="flex items-center gap-2 font-mono-data text-xs text-amber-400">
                <Film className="w-4 h-4" />
                <span>
                  {selectedFrame.episode}-{selectedFrame.sceneId} Frame Inspection Slate
                </span>
              </div>
              <button
                onClick={() => setSelectedFrame(null)}
                className="px-2 py-1 text-xs text-white/50 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-white/10 bg-black">
                <img src={selectedFrame.url} alt="Frame" className="w-full h-full object-contain" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-data text-xs">
                <div className="bg-[#161822] p-3 rounded border border-white/5">
                  <span className="text-[10px] text-white/40 block">Shot Type</span>
                  <span className="text-white font-medium">{selectedFrame.cinematography.shotType}</span>
                </div>
                <div className="bg-[#161822] p-3 rounded border border-white/5">
                  <span className="text-[10px] text-white/40 block">Prime Lens</span>
                  <span className="text-white font-medium">{selectedFrame.cinematography.lens}</span>
                </div>
                <div className="bg-[#161822] p-3 rounded border border-white/5">
                  <span className="text-[10px] text-white/40 block">Lighting Preset</span>
                  <span className="text-white font-medium">{selectedFrame.lighting.preset}</span>
                </div>
                <div className="bg-[#161822] p-3 rounded border border-white/5">
                  <span className="text-[10px] text-white/40 block">Aspect Ratio</span>
                  <span className="text-white font-medium">{selectedFrame.aspectRatio}</span>
                </div>
              </div>

              <div className="bg-[#0b0c10] border border-white/10 rounded p-3 text-xs text-white/70 font-mono-data whitespace-pre-line leading-relaxed">
                {selectedFrame.prompt}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
