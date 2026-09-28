import React from 'react';
import { Project, Scene, GeneratedFrame } from '../types/cinema';
import {
  Film,
  Lock,
  Plus,
  Play,
  Copy,
  Sliders,
  CheckCircle,
  Eye,
  Camera,
  Sun,
  Clock,
  Cloud,
  Database,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { detectSceneBridgeRequirement } from '../utils/continuityEngine';

interface TimelineViewProps {
  project: Project;
  onSelectScene: (scene: Scene) => void;
  onAddScene: () => void;
  onDuplicateScene: (scene: Scene) => void;
  onCompareFrames: (frameA: GeneratedFrame, frameB: GeneratedFrame) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  project,
  onSelectScene,
  onAddScene,
  onDuplicateScene,
  onCompareFrames,
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#090a0d] p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Episode 1: Visual Movie Timeline & State Sequence
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Sequential cinematic shot tape for "{project.title}". Monitor temporal flow, state snapshots, and character continuity across cuts.
          </p>
        </div>

        <button
          onClick={onAddScene}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Scene (EP1-00{project.scenes.length + 1})</span>
        </button>
      </div>

      {/* Visual Timeline Strip Ribbon */}
      <div className="my-8 py-6 px-4 bg-[#111319] border border-white/10 rounded-xl overflow-x-auto shadow-inner">
        <div className="flex items-center gap-4 min-w-max">
          {project.scenes.map((scene, idx) => {
            const masterFrame = project.generatedFrames.find((f) => f.sceneId === scene.id);
            const chars = project.characters.filter((c) => scene.characterIds.includes(c.id));
            const loc = project.locations.find((l) => l.id === scene.locationId);
            const isApproved = scene.isApproved || scene.status === 'approved' || Boolean(scene.approvedSnapshot);

            // Check bridge with previous scene
            const prevScene = idx > 0 ? project.scenes[idx - 1] : null;
            const bridge = prevScene ? detectSceneBridgeRequirement(prevScene, scene) : null;
            const hasBridgeGap = Boolean(bridge?.isBridgeNeeded || bridge?.needed);

            return (
              <React.Fragment key={scene.id}>
                {/* Scene Slate Card */}
                <div
                  onClick={() => onSelectScene(scene)}
                  className="group relative w-64 bg-[#161822] hover:bg-[#1c202c] border border-white/10 hover:border-amber-500/50 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 shadow-lg flex flex-col"
                >
                  {/* Master Frame Image Preview */}
                  <div className="relative aspect-video bg-black/60 overflow-hidden">
                    {masterFrame ? (
                      <img
                        src={masterFrame.url}
                        alt={scene.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}

                    {/* Master Frame / Snapshot Lock Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {isApproved && (
                        <div className="bg-emerald-500/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono-data text-black font-bold flex items-center gap-1 shadow">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>APPROVED</span>
                        </div>
                      )}
                      {scene.approvedSnapshot && (
                        <div className="bg-black/75 backdrop-blur-sm border border-amber-500/40 p-1 rounded text-amber-400" title="State snapshot locked">
                          <Database className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Scene ID Badge */}
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono-data text-white font-bold border border-white/10">
                      {scene.sceneId}
                    </div>

                    {/* Lens & Shot Type */}
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono-data text-amber-300 border border-white/10">
                      {scene.cinematography.lens} · {scene.cinematography.shotType.split(' ')[0]}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {scene.title}
                      </h4>
                      <p className="text-[11px] text-white/50 line-clamp-2 mt-1 leading-snug">
                        {scene.description}
                      </p>
                    </div>

                    {/* Scene Metadata Tags */}
                    <div className="mt-3 pt-2 border-t border-white/5 space-y-1 text-[10px] text-white/60 font-mono-data">
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-[130px]">{loc?.name || 'Interior'}</span>
                        <span className="text-amber-400/80">{scene.time}</span>
                      </div>
                      <div className="flex items-center justify-between text-white/40">
                        <span className="truncate max-w-[120px]">
                          {chars.map((c) => c.name).join(', ') || 'No cast'}
                        </span>
                        <span>{scene.lighting.preset.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow connector between scenes with optional bridge alert */}
                {idx < project.scenes.length - 1 && (
                  <div className="flex flex-col items-center justify-center px-1">
                    {hasBridgeGap ? (
                      <div
                        className="p-1 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[9px] font-mono-data mb-1 cursor-pointer"
                        title={bridge?.reason}
                        onClick={() => onSelectScene(scene)}
                      >
                        <Compass className="w-3 h-3 inline mr-0.5" />
                        GAP
                      </div>
                    ) : null}
                    <div className="flex items-center text-white/20">
                      <div className="w-6 h-0.5 bg-white/20" />
                      <div className="w-1.5 h-1.5 border-t-2 border-r-2 border-white/30 rotate-45 -ml-1" />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Detailed Scene List Table */}
      <div className="bg-[#111319] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white tracking-wide">
            Sequence Index & Movie State Snapshot Chain
          </h3>
          <span className="text-xs text-white/40 font-mono-data">
            {project.scenes.length} Scenes in Cut · {project.scenes.filter((s) => s.approvedSnapshot).length} Approved Snapshots
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {project.scenes.map((scene) => {
            const masterFrame = project.generatedFrames.find((f) => f.sceneId === scene.id);
            const chars = project.characters.filter((c) => scene.characterIds.includes(c.id));
            const loc = project.locations.find((l) => l.id === scene.locationId);
            const isApproved = scene.isApproved || scene.status === 'approved' || Boolean(scene.approvedSnapshot);

            return (
              <div
                key={scene.id}
                className="p-4 hover:bg-white/[0.02] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 h-12 bg-black rounded overflow-hidden shrink-0 border border-white/10 relative">
                    {masterFrame ? (
                      <img src={masterFrame.url} alt={scene.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-mono-data">
                        {scene.sceneId}
                      </div>
                    )}
                    {isApproved && (
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono-data text-amber-400 font-bold">
                        {scene.sceneId}
                      </span>
                      <span className="text-xs font-semibold text-white">{scene.title}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono-data uppercase ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {isApproved ? 'Approved Snapshot' : 'Proposed'}
                      </span>
                    </div>
                    <div className="text-xs text-white/50 max-w-xl truncate mt-0.5">
                      {scene.description}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-white/40">
                      <span>Location: {loc?.name}</span>
                      <span>·</span>
                      <span>Cast: {chars.map((c) => c.name).join(', ')}</span>
                      <span>·</span>
                      <span>Time: {scene.time}</span>
                      {scene.storyState && (
                        <>
                          <span>·</span>
                          <span className="text-amber-400/80">Beat: {scene.storyState.currentEvent || scene.storyState.narrativeMoment}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onSelectScene(scene)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 font-mono-data"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Open in Workspace</span>
                  </button>

                  <button
                    onClick={() => onDuplicateScene(scene)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors"
                    title="Duplicate Shot Setup"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
