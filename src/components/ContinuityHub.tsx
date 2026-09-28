import React, { useState } from 'react';
import { Project, Scene, GeneratedFrame, ContinuityWarning, SceneStateSnapshot } from '../types/cinema';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Eye,
  Sliders,
  RefreshCw,
  Lock,
  Sparkles,
  GitBranch,
  Layers,
  ArrowRight,
  Database,
  UserCheck,
  Compass,
  Zap,
} from 'lucide-react';
import { detectSceneBridgeRequirement } from '../utils/continuityEngine';

interface ContinuityHubProps {
  project: Project;
  onSelectScene: (scene: Scene) => void;
  onCompareFrames: (frameA: GeneratedFrame, frameB: GeneratedFrame) => void;
  warnings: ContinuityWarning[];
  onCorrectInconsistency?: (warningId: string, resolutionAction: string) => void;
}

export const ContinuityHub: React.FC<ContinuityHubProps> = ({
  project,
  onSelectScene,
  onCompareFrames,
  warnings,
  onCorrectInconsistency,
}) => {
  const [selectedSnapshot, setSelectedSnapshot] = useState<SceneStateSnapshot | null>(
    project.scenes[0]?.approvedSnapshot || null
  );
  const [activeTab, setActiveTab] = useState<'audits' | 'snapshots' | 'memories' | 'bridges'>('audits');

  const masterFramesCount = project.generatedFrames.filter((f) => f.isMasterFrame).length;
  const lockedCharactersCount = project.characters.filter((c) => c.isLocked).length;
  const lockedLocationsCount = project.locations.filter((l) => l.isLocked).length;
  const lockedPropsCount = project.props.filter((p) => p.isLocked).length;

  // Calculate temporal bridges across scenes
  const bridgeOpportunities = project.scenes.slice(1).map((curr, idx) => {
    const prev = project.scenes[idx];
    const bridge = detectSceneBridgeRequirement(prev, curr);
    return {
      prevScene: prev,
      currScene: curr,
      bridge,
    };
  }).filter((item) => item.bridge.isBridgeNeeded || item.bridge.needed);

  return (
    <div className="flex-1 overflow-y-auto bg-[#090a0d] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Temporal Consistency & Movie State Engine
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Persistent state snapshots, biometric locks, wardrobe memory, and automated scene-to-scene transition analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-mono-data">
            <CheckCircle className="w-4 h-4" />
            <span>
              Engine: {warnings.length === 0 ? '100% Invariant Coherence' : `${Math.max(65, 100 - warnings.length * 8)}% Temporal Match`}
            </span>
          </div>
        </div>
      </div>

      {/* Continuity Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111319] border border-white/10 rounded-xl p-4">
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-mono-data block">
            Locked Characters
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono-data">
              {lockedCharactersCount} / {project.characters.length}
            </span>
            <span className="text-[11px] text-amber-400 font-mono-data">Identity & Proportions</span>
          </div>
        </div>

        <div className="bg-[#111319] border border-white/10 rounded-xl p-4">
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-mono-data block">
            Locked Sets
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono-data">
              {lockedLocationsCount} / {project.locations.length}
            </span>
            <span className="text-[11px] text-amber-400 font-mono-data">Architecture & Light</span>
          </div>
        </div>

        <div className="bg-[#111319] border border-white/10 rounded-xl p-4">
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-mono-data block">
            Approved Snapshots
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono-data">
              {project.scenes.filter((s) => s.approvedSnapshot).length} / {project.scenes.length}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono-data">Chained States</span>
          </div>
        </div>

        <div className="bg-[#111319] border border-white/10 rounded-xl p-4">
          <span className="text-[11px] text-white/40 uppercase tracking-wider font-mono-data block">
            Bridge Alerts
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono-data">
              {bridgeOpportunities.length}
            </span>
            <span className="text-[11px] text-sky-400 font-mono-data">Transitional Gaps</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('audits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-mono-data transition-colors ${
            activeTab === 'audits'
              ? 'bg-amber-500 text-black'
              : 'text-white/60 hover:text-white bg-white/5'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Active Audits & Warnings ({warnings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-mono-data transition-colors ${
            activeTab === 'snapshots'
              ? 'bg-amber-500 text-black'
              : 'text-white/60 hover:text-white bg-white/5'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Scene State Snapshots ({project.scenes.filter((s) => s.approvedSnapshot).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('memories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-mono-data transition-colors ${
            activeTab === 'memories'
              ? 'bg-amber-500 text-black'
              : 'text-white/60 hover:text-white bg-white/5'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Character Temporal Memory</span>
        </button>

        <button
          onClick={() => setActiveTab('bridges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-mono-data transition-colors ${
            activeTab === 'bridges'
              ? 'bg-amber-500 text-black'
              : 'text-white/60 hover:text-white bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Transition Bridges ({bridgeOpportunities.length})</span>
        </button>
      </div>

      {/* Tab 1: Active Audits */}
      {activeTab === 'audits' && (
        <div className="bg-[#111319] border border-white/10 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Live Temporal & Visual Inconsistency Audit
              </h3>
            </div>
            <span className="text-xs text-white/40 font-mono-data">
              {warnings.length} Active Notice{warnings.length === 1 ? '' : 's'}
            </span>
          </div>

          {warnings.length > 0 ? (
            <div className="divide-y divide-white/5">
              {warnings.map((warn) => (
                <div
                  key={warn.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono-data font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {warn.type}
                      </span>
                      <span className="text-xs font-semibold text-white">{warn.message}</span>
                    </div>
                    <div className="text-xs text-white/50 pl-0.5 flex items-center gap-2">
                      <span className="text-amber-400/80">Correction:</span>
                      <span>{warn.recommendation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => {
                        if (onCorrectInconsistency) {
                          onCorrectInconsistency(warn.id, 'auto_conform');
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 font-mono-data"
                      title="Enforce state lock from previous approved frame"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Auto-Conform State</span>
                    </button>

                    {warn.compareSceneId && (
                      <button
                        onClick={() => {
                          const scene = project.scenes.find((s) => s.sceneId === warn.compareSceneId);
                          if (scene) onSelectScene(scene);
                        }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 font-mono-data"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect {warn.compareSceneId}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-3" />
              <h4 className="text-sm font-semibold text-white">Full Temporal Continuity Maintained</h4>
              <p className="text-xs text-white/50 max-w-md mt-1">
                Every scene in Episode 1 complies with locked character biometrics, location architectures, wardrobe weave, and motivated lighting directions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Scene State Snapshots */}
      {activeTab === 'snapshots' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Snapshot Selector */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono-data block">
                Approved Movie States
              </span>
              <div className="space-y-2">
                {project.scenes.map((scene) => {
                  const snap = scene.approvedSnapshot;
                  const isSelected = selectedSnapshot?.sceneId === scene.id;
                  return (
                    <div
                      key={scene.id}
                      onClick={() => snap && setSelectedSnapshot(snap)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                          : snap
                          ? 'bg-[#111319] border-white/10 hover:border-white/20'
                          : 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white font-mono-data">
                          {scene.sceneId} · {scene.title}
                        </span>
                        {snap ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono-data">
                            LOCKED SNAPSHOT
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/30 font-mono-data">Pending</span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50 line-clamp-1 mt-1">
                        {scene.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Snapshot Inspector Detail */}
            <div className="lg:col-span-2 bg-[#111319] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
              {selectedSnapshot ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-bold text-white font-mono-data">
                          State Snapshot: {selectedSnapshot.sceneId}
                        </h4>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono-data">
                        Approved: {new Date(selectedSnapshot.timestamp || selectedSnapshot.approvedAt || Date.now()).toLocaleDateString()} · Seed Anchor
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const targetScene = project.scenes.find((s) => s.id === selectedSnapshot.sceneId || s.sceneId === selectedSnapshot.sceneId);
                        if (targetScene) onSelectScene(targetScene);
                      }}
                      className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs rounded font-mono-data flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open in Scene Workspace</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Characters & Wardrobes */}
                    <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2">
                      <span className="text-[10px] font-mono-data uppercase text-amber-400 font-semibold block">
                        Characters & Wardrobes
                      </span>
                      {selectedSnapshot.characterStates?.map((char) => (
                        <div key={char.characterId} className="border-t border-white/5 pt-1.5 first:border-0 first:pt-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{char.characterName}</span>
                            <span className="text-[10px] font-mono-data text-emerald-400">
                              Identity Locked
                            </span>
                          </div>
                          <div className="text-[11px] text-white/60 mt-0.5">
                            Wardrobe: {char.wardrobeDescription}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono-data">
                            Hair: {char.hairCondition} · Emotion: {char.emotionalExpression}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Spatial Geometry */}
                    <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2">
                      <span className="text-[10px] font-mono-data uppercase text-sky-400 font-semibold block">
                        Spatial & Set Geometry
                      </span>
                      <div className="text-white/80 text-[11px]">
                        <span className="text-white/40 block text-[10px] uppercase font-mono-data">Set:</span>
                        {selectedSnapshot.locationState?.locationName || 'Interior Room'}
                      </div>
                      <div className="text-white/80 text-[11px]">
                        <span className="text-white/40 block text-[10px] uppercase font-mono-data">Key Subject Positions:</span>
                        {selectedSnapshot.spatialState?.characterPositions || selectedSnapshot.spatialState?.cameraPlacementDescription || 'Positioned in room'}
                      </div>
                      <div className="text-white/80 text-[11px]">
                        <span className="text-white/40 block text-[10px] uppercase font-mono-data">Environmental Anchor:</span>
                        {selectedSnapshot.spatialState?.environmentalAnchors || selectedSnapshot.spatialState?.doorRelationships || 'Established anchors'}
                      </div>
                    </div>

                    {/* Motivated Lighting & Atmosphere */}
                    <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2">
                      <span className="text-[10px] font-mono-data uppercase text-amber-400 font-semibold block">
                        Lighting & Atmosphere
                      </span>
                      <div className="text-white/80 text-[11px]">
                        <span className="text-white/40 block text-[10px] uppercase font-mono-data">Time / Weather:</span>
                        {selectedSnapshot.time} · {selectedSnapshot.weather}
                      </div>
                      <div className="text-white/80 text-[11px]">
                        <span className="text-white/40 block text-[10px] uppercase font-mono-data">Key Light:</span>
                        {selectedSnapshot.lightingState?.keyLightDirection} · {selectedSnapshot.lightingState?.colorTemperature}
                      </div>
                    </div>

                    {/* Story Continuity & Props */}
                    <div className="p-3 bg-black/40 border border-white/5 rounded-lg space-y-2">
                      <span className="text-[10px] font-mono-data uppercase text-emerald-400 font-semibold block">
                        Active Props & Plot State
                      </span>
                      <div className="text-white/80 text-[11px]">
                        <span className="text-white/40 block text-[10px] uppercase font-mono-data">Props in Frame:</span>
                        {selectedSnapshot.propStates?.map((p) => `${p.propName} (${p.state})`).join(', ') || 'No active hero props'}
                      </div>
                      <div className="text-white/80 text-[11px]">
                        <span className="text-white/40 block text-[10px] uppercase font-mono-data">Plot Beat:</span>
                        {selectedSnapshot.storyState?.currentEvent || selectedSnapshot.storyState?.narrativeMoment || 'Sequential scene progression'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-white/40 text-xs">
                  Select an approved scene state to view its complete continuity snapshot.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Character Temporal Memory */}
      {activeTab === 'memories' && (
        <div className="space-y-4">
          <div className="bg-[#111319] border border-white/10 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono-data pb-2 border-b border-white/10">
              Long-Term Character Visual Memory
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Tracks the appearance and wardrobe drift of recurring characters across the entire movie sequence.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(project.characterMemories || {}).map((mem) => {
                const char = project.characters.find((c) => c.id === mem.characterId);
                const charImg = char?.referenceImages?.[0]?.url || char?.avatarUrl;
                return (
                  <div key={mem.characterId} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {charImg ? (
                          <img src={charImg} alt={mem.characterName} className="w-8 h-8 rounded-full object-cover border border-amber-500/40" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 font-bold text-xs font-mono-data">
                            {mem.characterName[0]}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-white block">{mem.characterName}</span>
                          <span className="text-[10px] text-white/40 font-mono-data">
                            Seen in {mem.appearanceHistory?.length || mem.recentSceneIds?.length || 1} scenes
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono-data border border-emerald-500/30">
                        BIOMETRIC LOCKED
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-white/40 text-[10px] uppercase font-mono-data block">Primary Biometric Signature:</span>
                        <span className="text-white/80">{mem.canonicalBiometrics || `${char?.ethnicity || ''}, ${char?.skinTone || ''}, ${char?.faceShape || ''}`}</span>
                      </div>
                      <div>
                        <span className="text-white/40 text-[10px] uppercase font-mono-data block">Active Canonical Wardrobe:</span>
                        <span className="text-amber-300/90 font-mono-data">{mem.currentWardrobe}</span>
                      </div>
                      <div>
                        <span className="text-white/40 text-[10px] uppercase font-mono-data block">Recent Emotional Progression:</span>
                        <span className="text-white/70">{mem.lastKnownEmotionalState || mem.currentEmotionalState}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Transition Bridges */}
      {activeTab === 'bridges' && (
        <div className="bg-[#111319] border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Scene Transition & Cut Analysis Engine
              </h3>
            </div>
            <span className="text-xs text-white/40 font-mono-data">
              Detects spatial and temporal jump-cuts between approved scenes
            </span>
          </div>

          {bridgeOpportunities.length > 0 ? (
            <div className="space-y-3">
              {bridgeOpportunities.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-sky-300 font-mono-data">
                        {item.prevScene.sceneId} → {item.currScene.sceneId}
                      </span>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-mono-data uppercase">
                        Transition Gap Detected
                      </span>
                    </div>
                    <p className="text-xs text-white/80">
                      {item.bridge.reason}
                    </p>
                    <div className="text-[11px] text-sky-300/80 font-mono-data">
                      Cinematic Solution: {item.bridge.suggestedAction || item.bridge.proposedAction} ({item.bridge.suggestedShotType || item.bridge.suggestedShot})
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectScene(item.currScene)}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-black text-xs font-semibold rounded-lg font-mono-data shrink-0"
                  >
                    Insert Bridge Scene
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-white/50 text-xs">
              All scene transitions flow smoothly with no unmotivated spatial teleportation or lighting jumps.
            </div>
          )}
        </div>
      )}

      {/* Continuity Checklist Invariant Rules */}
      <div className="bg-[#111319] border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono-data pb-2 border-b border-white/10">
          The 12 Film Continuity Invariant Locks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            { title: 'Lock Identity', desc: 'Preserves biometric facial ratios, ear shape, nose bridge, eye distance, and skin undertones.' },
            { title: 'Lock Face', desc: 'Enforces exact facial bone structure while allowing contextual micro-expressions.' },
            { title: 'Lock Hair', desc: 'Maintains exact texture, parting, volume, hairline, and styling.' },
            { title: 'Lock Wardrobe', desc: 'Prevents random costume changes, texture morphing, or accessory drift.' },
            { title: 'Lock Location', desc: 'Fixes specific room, environment, and geographical anchor.' },
            { title: 'Lock Architecture', desc: 'Guarantees window, wall, door, and ceiling proportions remain spatially sound.' },
            { title: 'Lock Props', desc: 'Maintains prop appearance, placement, wear, and physical state.' },
            { title: 'Lock Lighting', desc: 'Locks key light angle, color temperature, and contrast ratios.' },
            { title: 'Lock Time of Day', desc: 'Anchors solar altitude and dawn/golden hour/night lighting motivation.' },
            { title: 'Lock Weather', desc: 'Preserves rain, overcast diffusion, atmospheric fog, or clear skies.' },
            { title: 'Lock Composition', desc: 'Fixes camera framing rules and headroom conventions.' },
            { title: 'Lock Visual Style', desc: 'Enforces film stock grain, color grading LUT, and lens characteristics.' },
          ].map((lock, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium block">{lock.title}</span>
                <span className="text-white/50 text-[11px] mt-0.5 block leading-snug">
                  {lock.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
