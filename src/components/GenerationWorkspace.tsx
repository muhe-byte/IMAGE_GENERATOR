import React, { useState, useMemo } from 'react';
import {
  Project,
  Scene,
  GeneratedFrame,
  AspectRatio,
  ShotType,
  CameraAngle,
  CameraMovement,
  LensFocalLength,
  DepthOfField,
  FocusTarget,
  LightingPreset,
  KeyLightDirection,
  ContinuityWarning,
  GranularLocks,
  ChangeOnlyRequest,
} from '../types/cinema';
import { generateCinematicImages, askCinematographerAssistant } from '../services/api';
import { generateCinematicPrompt } from '../utils/cinematicPromptEngine';
import {
  analyzePreGenerationContinuity,
  detectSceneBridgeRequirement,
  createSceneStateSnapshot,
  DEFAULT_GRANULAR_LOCKS,
} from '../utils/continuityEngine';
import { parseSceneCommand, buildUniversalScenePrompt } from '../utils/referenceSelector';
import {
  Sparkles,
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  ChevronDown,
  Layers,
  Camera,
  Sun,
  Palette,
  Crosshair,
  Compass,
  ArrowRight,
  ShieldCheck,
  Download,
  Info,
  History,
  RotateCcw,
  Zap,
  MapPin,
  Clock,
  GitCommit,
  GitBranch,
  CornerDownRight,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Eye,
  Package,
} from 'lucide-react';

interface GenerationWorkspaceProps {
  project: Project;
  activeScene: Scene;
  onSceneChange: (scene: Scene) => void;
  onUpdateScene: (updatedScene: Scene) => void;
  onContinueFromPreviousScene: (previousScene: Scene) => void;
  onCreateTransitionScene: (sceneA: Scene, sceneB: Scene) => void;
  onApproveScene: (scene: Scene, frame: GeneratedFrame) => void;
  aspectRatio: AspectRatio;
  showGrid: boolean;
  showFalseColor: boolean;
  onSetMasterFrame: (frame: GeneratedFrame) => void;
  onCompareFrames: (frameA: GeneratedFrame, frameB: GeneratedFrame) => void;
  onSaveFrame: (frame: GeneratedFrame) => void;
  continuityWarnings: ContinuityWarning[];
  onOpenVisualBible?: () => void;
}

export const GenerationWorkspace: React.FC<GenerationWorkspaceProps> = ({
  project,
  activeScene,
  onSceneChange,
  onUpdateScene,
  onContinueFromPreviousScene,
  onCreateTransitionScene,
  onApproveScene,
  aspectRatio,
  showGrid,
  showFalseColor,
  onSetMasterFrame,
  onCompareFrames,
  onSaveFrame,
  continuityWarnings,
  onOpenVisualBible,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [showVariationMenu, setShowVariationMenu] = useState(false);
  const [showPreGenModal, setShowPreGenModal] = useState(false);
  const [showSnapshotInspector, setShowSnapshotInspector] = useState(false);
  const [showChangeOnlyForm, setShowChangeOnlyForm] = useState(false);
  const [activeTabSubView, setActiveTabSubView] = useState<'cinematography' | 'spatial' | 'story' | 'locks'>('cinematography');

  // Universal Scene Command Input
  const [commandInput, setCommandInput] = useState<string>(() => `${activeScene.sceneId} image ${activeScene.description}`);

  // Sync command input when activeScene changes
  React.useEffect(() => {
    setCommandInput(`${activeScene.sceneId} image ${activeScene.description}`);
  }, [activeScene.id, activeScene.sceneId]);

  // Parse Command in Real-Time
  const parsedCommand = useMemo(() => {
    return parseSceneCommand(commandInput, project, activeScene.sceneId);
  }, [commandInput, project, activeScene.sceneId]);

  const universalPrompt = useMemo(() => {
    return buildUniversalScenePrompt(parsedCommand, project);
  }, [parsedCommand, project]);

  // Change-Only Form State
  const [changeOnlyTarget, setChangeOnlyTarget] = useState<'wardrobe' | 'camera' | 'lighting' | 'expression' | 'props' | 'background'>('wardrobe');
  const [changeOnlyDescription, setChangeOnlyDescription] = useState('Change wardrobe to dark blue shirt');

  // Current scene list index and previous approved scene / snapshot
  const sceneIdx = project.scenes.findIndex((s) => s.id === activeScene.id);
  const previousScene = sceneIdx > 0 ? project.scenes[sceneIdx - 1] : null;
  const previousSnapshot = useMemo(() => {
    if (!previousScene) return null;
    return project.stateSnapshots.find((ss) => ss.sceneId === previousScene.sceneId) || null;
  }, [project.stateSnapshots, previousScene]);

  // Bridge detection
  const bridgeSuggestion = useMemo(() => {
    if (!previousScene) return null;
    return detectSceneBridgeRequirement(previousScene, activeScene);
  }, [previousScene, activeScene]);

  const activeLocation = project.locations.find((l) => l.id === activeScene.locationId);
  const activeCharacters = project.characters.filter((c) => activeScene.characterIds.includes(c.id));
  const activeProps = project.props.filter((p) => activeScene.propIds.includes(p.id));

  // Recent generated takes for current scene
  const [recentGeneratedFrames, setRecentGeneratedFrames] = useState<GeneratedFrame[]>(() => {
    return project.generatedFrames.filter((f) => f.sceneId === activeScene.id);
  });

  // Current displayed frame
  const currentFrame =
    recentGeneratedFrames[activeFrameIndex] ||
    project.generatedFrames.find((f) => f.sceneId === activeScene.id) ||
    project.generatedFrames[0];

  // Pre-generation Continuity Analysis
  const preGenAnalysis = useMemo(() => {
    return analyzePreGenerationContinuity(
      activeScene,
      previousSnapshot,
      project.characters,
      activeLocation,
      activeProps
    );
  }, [activeScene, previousSnapshot, project.characters, activeLocation, activeProps]);

  // Intelligent Prompt Generation
  const promptData = generateCinematicPrompt(
    activeScene,
    activeCharacters,
    activeLocation,
    activeProps,
    project.visualDNA,
    previousSnapshot
  );

  // Handle Generation
  const handleInitiateGeneration = (count: number = 1, variationType?: any) => {
    if (preGenAnalysis.hasConflicts && !showPreGenModal) {
      setShowPreGenModal(true);
      return;
    }
    executeGeneration(count, variationType);
  };

  const executeGeneration = async (count: number = 1, variationType?: any) => {
    setShowPreGenModal(false);
    setIsGenerating(true);
    try {
      const newFrames = await generateCinematicImages({
        scene: activeScene,
        project,
        characters: activeCharacters,
        location: activeLocation,
        props: activeProps,
        aspectRatio,
        count,
        variationType,
        previousSnapshot,
      });

      if (newFrames.length > 0) {
        setRecentGeneratedFrames((prev) => [...newFrames, ...prev]);
        setActiveFrameIndex(0);
        onSaveFrame(newFrames[0]);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
      setShowVariationMenu(false);
    }
  };

  // Execute Universal Scene Command without rewriting prompt
  const handleExecuteUniversalSceneCommand = async () => {
    // Sync clean prompt into activeScene
    const updatedScene: Scene = {
      ...activeScene,
      sceneId: parsedCommand.sceneId || activeScene.sceneId,
      description: parsedCommand.cleanPrompt,
      characterIds: parsedCommand.matchedCharacterIds.length > 0 ? parsedCommand.matchedCharacterIds : activeScene.characterIds,
      locationId: parsedCommand.matchedLocationId || activeScene.locationId,
      propIds: parsedCommand.matchedPropIds.length > 0 ? parsedCommand.matchedPropIds : activeScene.propIds,
    };
    onUpdateScene(updatedScene);

    setShowPreGenModal(false);
    setIsGenerating(true);
    try {
      const newFrames = await generateCinematicImages({
        scene: updatedScene,
        project,
        characters: project.characters.filter((c) => updatedScene.characterIds.includes(c.id)),
        location: project.locations.find((l) => l.id === updatedScene.locationId),
        props: project.props.filter((p) => updatedScene.propIds.includes(p.id)),
        aspectRatio,
        count: 1,
        previousSnapshot,
      });

      if (newFrames.length > 0) {
        setRecentGeneratedFrames((prev) => [...newFrames, ...prev]);
        setActiveFrameIndex(0);
        onSaveFrame(newFrames[0]);
      }
    } catch (error) {
      console.error('Universal generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Change-Only Generation Execution
  const handleApplyChangeOnly = () => {
    const updatedScene: Scene = {
      ...activeScene,
      changeOnlyRequest: {
        active: true,
        targetElement: changeOnlyTarget,
        changeDescription: changeOnlyDescription,
        preservedElements: ['identity', 'location', 'lighting', 'camera', 'props'],
      },
    };
    onUpdateScene(updatedScene);
    setShowChangeOnlyForm(false);
    executeGeneration(1);
  };

  // Restore Continuity (Continuity Recovery)
  const handleRestoreContinuity = () => {
    if (!previousSnapshot) return;
    const restoredScene: Scene = {
      ...activeScene,
      characterStates: previousSnapshot.characterStates,
      lighting: { ...previousSnapshot.lightingState },
      time: previousSnapshot.time,
      weather: previousSnapshot.weather,
      spatialState: { ...previousSnapshot.spatialState },
      locks: { ...previousSnapshot.locks },
      primaryContinuityRefId: previousSnapshot.approvedFrameId,
    };
    onUpdateScene(restoredScene);
    executeGeneration(1);
  };

  // AI Cinematographer Assistant
  const handleAiAssistantSuggest = async () => {
    setIsAiAssisting(true);
    try {
      const recommendation = await askCinematographerAssistant({
        actionDescription: activeScene.description,
        genre: project.genre,
        visualStyle: project.visualStyle,
        characters: activeCharacters,
        location: activeLocation,
        mood: activeScene.emotion,
      });

      if (recommendation) {
        const updatedScene: Scene = {
          ...activeScene,
          cinematography: {
            ...activeScene.cinematography,
            shotType: (recommendation.shotType as ShotType) || activeScene.cinematography.shotType,
            cameraAngle: (recommendation.cameraAngle as CameraAngle) || activeScene.cinematography.cameraAngle,
            cameraMovement: (recommendation.cameraMovement as CameraMovement) || activeScene.cinematography.cameraMovement,
            lens: (recommendation.lens as LensFocalLength) || activeScene.cinematography.lens,
            depthOfField: (recommendation.depthOfField as DepthOfField) || activeScene.cinematography.depthOfField,
          },
          lighting: {
            ...activeScene.lighting,
            preset: (recommendation.lightingPreset as LightingPreset) || activeScene.lighting.preset,
            keyLightDirection: (recommendation.keyLightDirection as KeyLightDirection) || activeScene.lighting.keyLightDirection,
            contrastRatio: (recommendation.contrastRatio as any) || activeScene.lighting.contrastRatio,
            colorTemperature: recommendation.colorTemperature || activeScene.lighting.colorTemperature,
          },
        };
        onUpdateScene(updatedScene);
      }
    } catch (e) {
      console.warn('AI Assistant error:', e);
    } finally {
      setIsAiAssisting(false);
    }
  };

  // Toggle individual granular lock
  const toggleLock = (lockKey: keyof GranularLocks) => {
    const updatedLocks = {
      ...activeScene.locks,
      [lockKey]: !activeScene.locks[lockKey],
    };
    onUpdateScene({ ...activeScene, locks: updatedLocks });
  };

  // Quick field updates
  const updateCinematography = (key: keyof Scene['cinematography'], value: any) => {
    onUpdateScene({
      ...activeScene,
      cinematography: {
        ...activeScene.cinematography,
        [key]: value,
      },
    });
  };

  const updateLighting = (key: keyof Scene['lighting'], value: any) => {
    onUpdateScene({
      ...activeScene,
      lighting: {
        ...activeScene.lighting,
        [key]: value,
      },
    });
  };

  // Copy prompt
  const copyPromptText = () => {
    navigator.clipboard.writeText(promptData.fullPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const shotTypes: ShotType[] = [
    'Extreme Wide Shot',
    'Wide Shot',
    'Full Shot',
    'Medium Wide',
    'Medium Shot',
    'Medium Close-Up',
    'Close-Up',
    'Extreme Close-Up',
    'Over-the-Shoulder',
    'Two Shot',
    'POV',
    'Insert Shot',
  ];

  const lenses: LensFocalLength[] = ['18mm', '24mm', '28mm', '35mm', '50mm', '85mm', '135mm'];
  const cameraAngles: CameraAngle[] = ['Eye level', 'Low angle', 'High angle', 'Dutch angle', 'Overhead', 'Ground level'];
  const cameraMovements: CameraMovement[] = ['Static', 'Push-in composition', 'Pull-back composition', 'Tracking composition', 'Handheld', 'Steadicam', 'Crane perspective'];
  const lightingPresets: LightingPreset[] = ['Natural daylight', 'Soft window light', 'Dramatic side lighting', 'Tungsten', 'Blue hour', 'Golden hour', 'Overcast', 'Low-key cinematic', 'High-key cinematic', 'Candlelight'];
  const keyDirections: KeyLightDirection[] = ['Camera Left 45°', 'Camera Right 45°', 'Direct Front', 'Back-rim', 'Overhead', 'Low-angle up'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#07080a]">
      {/* ======================================================== */}
      {/* TOP PRODUCTION WORKFLOW RIBBON                          */}
      {/* ======================================================== */}
      <div className="px-4 sm:px-6 py-2 bg-[#0c0e14] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          {/* Continue from Previous Scene Button */}
          {previousScene && (
            <button
              onClick={() => onContinueFromPreviousScene(previousScene)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition-all shadow-sm group"
              title="Automatically inherit wardrobe, architecture, lighting, and spatial relationships from previous approved take"
            >
              <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
              <span>CONTINUE FROM PREVIOUS SCENE ({previousScene.sceneId})</span>
            </button>
          )}

          {/* Change-Only Mode Toggle */}
          <button
            onClick={() => setShowChangeOnlyForm(!showChangeOnlyForm)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeScene.changeOnlyRequest?.active || showChangeOnlyForm
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-white/5 text-white/70 border-white/10 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Change-Only Mode</span>
          </button>

          {/* Previous Approved State Snapshot Badge */}
          {previousSnapshot ? (
            <button
              onClick={() => setShowSnapshotInspector(!showSnapshotInspector)}
              className="hidden lg:flex items-center gap-1.5 text-xs text-white/50 hover:text-white font-mono-data bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded border border-white/10 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>State: {previousSnapshot.sceneId} Approved</span>
            </button>
          ) : (
            <span className="hidden lg:inline text-[11px] text-white/30 font-mono-data">
              Origin Scene: Master Reference 001
            </span>
          )}

          {/* Pre-Gen Consistency Status Indicator */}
          <button
            onClick={() => setShowPreGenModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-data border transition-colors ${
              preGenAnalysis.hasConflicts
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {preGenAnalysis.hasConflicts ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {preGenAnalysis.hasConflicts ? 'Continuity Conflict Detected' : 'Pre-Gen Continuity Verified'}
            </span>
          </button>
        </div>

        {/* Human Approval Gate Status */}
        <div className="flex items-center gap-2">
          {activeScene.isApproved ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono-data bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded font-semibold">
              <Check className="w-3 h-3" />
              <span>APPROVED SCENE STATE</span>
            </span>
          ) : (
            <span className="text-xs text-white/40 font-mono-data bg-white/5 border border-white/10 px-2.5 py-1 rounded">
              Pending Human Approval Gate
            </span>
          )}

          {currentFrame && !activeScene.isApproved && (
            <button
              onClick={() => onApproveScene(activeScene, currentFrame)}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-lg transition-colors shadow-sm"
              title="Approve this take and create an immutable Scene State Snapshot for future scenes"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Approve Scene</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SCENE BRIDGE GAP DETECTOR BANNER (IF DETECTED)           */}
      {/* ======================================================== */}
      {bridgeSuggestion?.isBridgeNeeded && previousScene && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border-b border-amber-500/30 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <GitBranch className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold text-amber-300 font-mono-data mr-2">
                CONTINUITY GAP DETECTED:
              </span>
              <span className="text-white/80">{bridgeSuggestion.reason}</span>
            </div>
          </div>
          <button
            onClick={() => onCreateTransitionScene(previousScene, activeScene)}
            className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-black font-semibold text-xs rounded hover:bg-amber-400 transition-colors shrink-0"
          >
            <span>Create Transition Scene</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHANGE-ONLY INSTRUCTION ACCORDION                        */}
      {/* ======================================================== */}
      {showChangeOnlyForm && (
        <div className="p-4 bg-[#10131b] border-b border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-cyan-400 font-semibold font-mono-data shrink-0">
              CHANGE ONLY:
            </span>
            <select
              value={changeOnlyTarget}
              onChange={(e) => setChangeOnlyTarget(e.target.value as any)}
              className="bg-[#171b26] border border-white/15 rounded p-1.5 text-xs text-white"
            >
              <option value="wardrobe">Wardrobe (Keep Face & Set)</option>
              <option value="camera">Camera / Framing (Keep Subject)</option>
              <option value="lighting">Lighting Setup (Keep Subject)</option>
              <option value="expression">Micro-Expression (Keep Face)</option>
              <option value="props">Hero Object (Keep Set)</option>
              <option value="background">Background Angle (Keep Character)</option>
            </select>
            <input
              type="text"
              value={changeOnlyDescription}
              onChange={(e) => setChangeOnlyDescription(e.target.value)}
              placeholder="e.g. Change Maya's shirt to dark blue shirt..."
              className="flex-1 sm:w-80 bg-[#171b26] border border-white/15 rounded p-1.5 text-xs text-white"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleApplyChangeOnly}
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded transition-colors"
            >
              Generate Change-Only Frame
            </button>
            <button
              onClick={() => setShowChangeOnlyForm(false)}
              className="px-2.5 py-1.5 bg-white/10 text-white rounded hover:bg-white/15"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* UNIVERSAL SCENE COMMAND BAR                              */}
      {/* (HIGHEST SCENE-SPECIFIC AUTHORITY - PRESERVES PROMPT)    */}
      {/* ======================================================== */}
      <div className="px-4 sm:px-6 py-3 bg-[#0d0f16] border-b border-white/10 shrink-0 space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="flex-1 flex items-center bg-[#151722] border border-white/15 focus-within:border-amber-500/70 rounded-xl px-3.5 py-1.5 shadow-inner">
            <span className="text-[11px] font-mono-data text-amber-400 font-bold mr-2 uppercase shrink-0">
              Scene Command:
            </span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="e.g. EP1-001 image Anna sits alone at the kitchen table reading an old letter. 50mm lens, early morning light..."
              className="flex-1 bg-transparent text-xs text-white placeholder-white/30 focus:outline-none font-mono-data"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExecuteUniversalSceneCommand}
              disabled={isGenerating || !commandInput.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 font-mono-data disabled:opacity-40 flex items-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>GENERATE SCENE</span>
            </button>

            {onOpenVisualBible && (
              <button
                onClick={onOpenVisualBible}
                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl text-xs font-mono-data transition-colors flex items-center gap-1.5"
                title="Edit Movie Visual Bible (Characters, Sets, Props, Master Prompt)"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Visual Bible</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Reference Selection Engine Feedback */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono-data text-white/60">
          <span className="text-white/40 uppercase">Auto-Matched:</span>
          {parsedCommand.matchedCharacterIds.length > 0 ? (
            parsedCommand.matchedCharacterIds.map((cId) => {
              const char = project.characters.find((c) => c.id === cId);
              return (
                <span key={cId} className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <UserCheck className="w-2.5 h-2.5" />
                  <span>{char?.name || 'Character'} (Identity Locked)</span>
                </span>
              );
            })
          ) : (
            <span className="px-2 py-0.5 rounded bg-white/5 text-white/40">No specific cast mentioned</span>
          )}

          {parsedCommand.matchedLocationId && (
            <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              <span>{project.locations.find((l) => l.id === parsedCommand.matchedLocationId)?.name} (Set Locked)</span>
            </span>
          )}

          {parsedCommand.matchedPropIds.map((pId) => {
            const prop = project.props.find((p) => p.id === pId);
            return (
              <span key={pId} className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Package className="w-2.5 h-2.5" />
                <span>{prop?.name}</span>
              </span>
            );
          })}

          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300/80 border border-amber-500/20">
            {parsedCommand.selectedReferenceImages.length} Ref Photo{parsedCommand.selectedReferenceImages.length === 1 ? '' : 's'} Selected
          </span>

          <span className="text-white/30 hidden md:inline">
            · Visual DNA: {project.masterCinematicPrompt ? 'Master Prompt Active' : project.visualStyle}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN 3-COLUMN WORKSPACE BODY                             */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ======================================================== */}
        {/* LEFT COLUMN: SCENE CONFIGURATION & STORY ARC             */}
        {/* ======================================================== */}
        <aside className="w-full lg:w-[350px] xl:w-[390px] shrink-0 border-r border-white/10 bg-[#0e1014] flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#12141a]">
            <div className="flex items-center gap-2">
              <span className="font-mono-data text-xs text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {activeScene.sceneId}
              </span>
              <select
                value={activeScene.id}
                onChange={(e) => {
                  const s = project.scenes.find((sc) => sc.id === e.target.value);
                  if (s) {
                    onSceneChange(s);
                    setRecentGeneratedFrames(project.generatedFrames.filter((f) => f.sceneId === s.id));
                    setActiveFrameIndex(0);
                  }
                }}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {project.scenes.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#12141a] text-white">
                    {s.sceneId}: {s.title}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-white/40 font-mono-data">{activeScene.episode}</span>
          </div>

          <div className="p-4 space-y-5 flex-1">
            {/* AI Cinematographer Copilot Card */}
            <div className="bg-gradient-to-br from-amber-950/20 to-neutral-900 border border-amber-500/25 rounded-lg p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Cinematographer Copilot</span>
                </div>
                <button
                  onClick={handleAiAssistantSuggest}
                  disabled={isAiAssisting}
                  className="text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {isAiAssisting ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Compass className="w-3 h-3" />
                  )}
                  <span>Direct Scene</span>
                </button>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Recommends optimum focal lengths, motivated light angles, and eye-lines based on emotional tension.
              </p>
            </div>

            {/* Scene Action Description */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider font-mono-data">
                Scene Narrative & Action
              </label>
              <textarea
                rows={3}
                value={activeScene.description}
                onChange={(e) => onUpdateScene({ ...activeScene, description: e.target.value })}
                placeholder="Describe what occurs in this scene..."
                className="w-full bg-[#14171e] border border-white/10 rounded-lg p-3 text-xs text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Cast / Characters in Frame */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider font-mono-data">
                  Cast in Frame (Level 1 Biometrics)
                </label>
                <span className="text-[10px] text-white/40">
                  {activeCharacters.filter((c) => c.isLocked).length} Locked
                </span>
              </div>
              <div className="space-y-1.5">
                {project.characters.map((char) => {
                  const isSelected = activeScene.characterIds.includes(char.id);
                  const charState = activeScene.characterStates.find((cs) => cs.characterId === char.id);
                  return (
                    <div
                      key={char.id}
                      onClick={() => {
                        const newIds = isSelected
                          ? activeScene.characterIds.filter((id) => id !== char.id)
                          : [...activeScene.characterIds, char.id];
                        onUpdateScene({ ...activeScene, characterIds: newIds });
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white/10 border-amber-500/40 text-white'
                          : 'bg-[#14171e] border-white/5 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/80">
                          {char.name[0]}
                        </div>
                        <div>
                          <div className="text-xs font-medium">{char.name}</div>
                          <div className="text-[10px] text-white/40 truncate max-w-[170px]">
                            {charState?.wardrobeDescription || char.clothing.slice(0, 30)}
                          </div>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono-data">
                        <Lock className="w-2.5 h-2.5" />
                        Level 1
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location Selection */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider font-mono-data">
                Location Set (Level 2 Architecture)
              </label>
              <select
                value={activeScene.locationId}
                onChange={(e) => onUpdateScene({ ...activeScene, locationId: e.target.value })}
                className="w-full bg-[#14171e] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
              >
                {project.locations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-[#14171e]">
                    {loc.name} ({loc.isInterior ? 'Interior' : 'Exterior'})
                  </option>
                ))}
              </select>
              {activeLocation && (
                <p className="mt-1 text-[10px] text-white/40 truncate">{activeLocation.architecture}</p>
              )}
            </div>

            {/* Time, Weather, Emotion */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider font-mono-data mb-1">
                  Time
                </label>
                <select
                  value={activeScene.time}
                  onChange={(e) => onUpdateScene({ ...activeScene, time: e.target.value })}
                  className="w-full bg-[#14171e] border border-white/10 rounded p-1.5 text-xs text-white"
                >
                  {['Dawn', 'Morning', 'Afternoon', 'Golden hour', 'Evening', 'Night'].map((t) => (
                    <option key={t} value={t} className="bg-[#14171e]">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider font-mono-data mb-1">
                  Weather
                </label>
                <select
                  value={activeScene.weather}
                  onChange={(e) => onUpdateScene({ ...activeScene, weather: e.target.value })}
                  className="w-full bg-[#14171e] border border-white/10 rounded p-1.5 text-xs text-white"
                >
                  {['Clear', 'Cloudy', 'Rain', 'Fog', 'Overcast', 'Storm'].map((w) => (
                    <option key={w} value={w} className="bg-[#14171e]">
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider font-mono-data mb-1">
                  Emotion
                </label>
                <select
                  value={activeScene.emotion}
                  onChange={(e) => onUpdateScene({ ...activeScene, emotion: e.target.value })}
                  className="w-full bg-[#14171e] border border-white/10 rounded p-1.5 text-xs text-white"
                >
                  {[
                    'Grief restrained by determination',
                    'Suspicion',
                    'Tension',
                    'Fear',
                    'Calm',
                    'Hope',
                    'Shock',
                    'Desperation',
                  ].map((em) => (
                    <option key={em} value={em} className="bg-[#14171e]">
                      {em}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recurring Props */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider font-mono-data">
                Hero Props in Scene
              </label>
              <div className="flex flex-wrap gap-1.5">
                {project.props.map((prop) => {
                  const isSelected = activeScene.propIds.includes(prop.id);
                  return (
                    <button
                      key={prop.id}
                      onClick={() => {
                        const newIds = isSelected
                          ? activeScene.propIds.filter((id) => id !== prop.id)
                          : [...activeScene.propIds, prop.id];
                        onUpdateScene({ ...activeScene, propIds: newIds });
                      }}
                      className={`px-2 py-1 rounded text-xs transition-colors border ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                          : 'bg-[#14171e] text-white/50 border-white/5 hover:text-white'
                      }`}
                    >
                      {prop.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================== */}
        {/* CENTER COLUMN: CINEMA MONITOR & RENDERED FRAME           */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col bg-[#07080a] overflow-hidden">
          {/* Cinema Monitor Frame Container */}
          <div className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {currentFrame ? (
              <div className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-sm overflow-hidden border border-white/10 group">
                {/* Image Display */}
                <img
                  src={currentFrame.url}
                  alt="Cinema Frame"
                  className={`max-w-full max-h-[66vh] object-contain transition-all duration-300 ${
                    showFalseColor ? 'contrast-200 hue-rotate-180 invert brightness-110' : ''
                  }`}
                />

                {/* Master Frame Badge */}
                {currentFrame.isMasterFrame && (
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-amber-500/40 text-[11px] font-mono-data text-amber-400 font-semibold shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>MASTER FRAME CHAIN ANCHOR</span>
                  </div>
                )}

                {/* Camera Metadata Slate (Bottom Left) */}
                <div className="absolute bottom-4 left-4 z-20 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded border border-white/15 text-[11px] font-mono-data text-white/80 space-y-0.5">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <span>{activeScene.sceneId}</span>
                    <span>·</span>
                    <span>{currentFrame.cinematography.shotType}</span>
                  </div>
                  <div className="text-white/60">
                    {currentFrame.cinematography.lens} · {currentFrame.cinematography.cameraAngle} · {currentFrame.lighting.preset}
                  </div>
                </div>

                {/* Aspect Ratio Badge */}
                <div className="absolute bottom-4 right-4 z-20 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/15 text-[10px] font-mono-data text-white/70">
                  {currentFrame.aspectRatio} · ARRI ALEXA LF
                </div>

                {/* Composition Grid */}
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3 border border-amber-400/20">
                    <div className="border-r border-b border-amber-400/25" />
                    <div className="border-r border-b border-amber-400/25" />
                    <div className="border-b border-amber-400/25" />
                    <div className="border-r border-b border-amber-400/25" />
                    <div className="border-r border-b border-amber-400/25 flex items-center justify-center">
                      <Crosshair className="w-6 h-6 text-amber-400/30" />
                    </div>
                    <div className="border-b border-amber-400/25" />
                    <div className="border-r border-b border-amber-400/25" />
                    <div className="border-r border-b border-amber-400/25" />
                    <div />
                  </div>
                )}

                {/* Loading State Overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                    <div className="text-sm font-semibold text-white font-mono-data tracking-wider">
                      SYNTHESIZING NEXT CINEMATIC FRAME...
                    </div>
                    <div className="text-xs text-white/50 font-mono-data">
                      Preserving Level 1 biometrics & spatial scene geometry
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/15 rounded-xl max-w-md">
                <Camera className="w-10 h-10 text-white/30 mb-3" />
                <h4 className="text-sm font-semibold text-white mb-1">No Frame Rendered Yet</h4>
                <p className="text-xs text-white/50 mb-4">
                  Configure scene optics, then initiate generation.
                </p>
                <button
                  onClick={() => handleInitiateGeneration(1)}
                  className="px-4 py-2 bg-amber-500 text-black text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Generate Scene Frame
                </button>
              </div>
            )}
          </div>

          {/* Film Strip of Takes */}
          {recentGeneratedFrames.length > 1 && (
            <div className="px-6 py-2 bg-[#0c0d12] border-t border-white/5 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] text-white/40 uppercase font-mono-data shrink-0 mr-1">
                Takes ({recentGeneratedFrames.length}):
              </span>
              {recentGeneratedFrames.map((frame, idx) => (
                <button
                  key={frame.id}
                  onClick={() => setActiveFrameIndex(idx)}
                  className={`relative w-16 h-10 rounded overflow-hidden border shrink-0 transition-all ${
                    activeFrameIndex === idx
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : 'border-white/10 hover:border-white/30 opacity-70'
                  }`}
                >
                  <img src={frame.url} alt={`Take ${idx + 1}`} className="w-full h-full object-cover" />
                  {frame.isMasterFrame && (
                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Workspace Action Bar */}
          <div className="px-6 py-3 bg-[#0f1117] border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            {/* Generation Batch Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleInitiateGeneration(1)}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Generate 1</span>
              </button>

              <button
                onClick={() => handleInitiateGeneration(2)}
                disabled={isGenerating}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Generate 2
              </button>

              <button
                onClick={() => handleInitiateGeneration(4)}
                disabled={isGenerating}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Generate 4
              </button>
            </div>

            {/* Human Gate, Variations & Master Frame Controls */}
            {currentFrame && (
              <div className="flex items-center gap-2">
                {/* Approve Scene Button */}
                <button
                  onClick={() => onApproveScene(activeScene, currentFrame)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    activeScene.isApproved
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-md'
                  }`}
                  title="Approve this frame to create an authoritative Scene State Snapshot for subsequent scenes"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{activeScene.isApproved ? 'Approved & Locked' : 'Approve Scene'}</span>
                </button>

                {/* Restore Continuity Button */}
                {previousSnapshot && (
                  <button
                    onClick={handleRestoreContinuity}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-amber-300 text-xs font-medium rounded-lg transition-colors border border-amber-500/25"
                    title="Restore character and location from previous approved snapshot while preserving current camera and action"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Continuity</span>
                  </button>
                )}

                {/* Master Frame Toggle */}
                <button
                  onClick={() => onSetMasterFrame(currentFrame)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    currentFrame.isMasterFrame
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{currentFrame.isMasterFrame ? 'Master Anchor' : 'Set Master Frame'}</span>
                </button>

                {/* Compare Button */}
                {project.generatedFrames.length > 1 && (
                  <button
                    onClick={() => {
                      const otherFrame = project.generatedFrames.find((f) => f.id !== currentFrame.id);
                      if (otherFrame) onCompareFrames(currentFrame, otherFrame);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Compare</span>
                  </button>
                )}

                {/* Prompt Details Inspector Toggle */}
                <button
                  onClick={() => setShowPromptDetails(!showPromptDetails)}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    showPromptDetails
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                  }`}
                  title="Inspect Synthesized Prompt & Directorial Rationale"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Prompt Inspector Drawer */}
          {showPromptDetails && (
            <div className="p-4 bg-[#111319] border-t border-white/10 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono-data">
                    Synthesized Temporal Continuity Prompt
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono-data bg-amber-500/10 px-1.5 py-0.5 rounded">
                    4-Level Hierarchy
                  </span>
                </div>
                <button
                  onClick={copyPromptText}
                  className="flex items-center gap-1 text-[11px] text-white/50 hover:text-white"
                >
                  {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPrompt ? 'Copied' : 'Copy Full Prompt'}</span>
                </button>
              </div>

              <div className="bg-[#0b0c10] border border-white/10 rounded p-2.5 text-xs text-white/70 font-mono-data leading-relaxed mb-3 whitespace-pre-line">
                {promptData.fullPrompt}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-xs text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-amber-300 block mb-1">
                  Directorial Continuity Rationale:
                </span>
                {promptData.explanation}
              </div>
            </div>
          )}
        </main>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: OPTICS, 12 LOCKS, SPATIAL & DIAGNOSTICS    */}
        {/* ======================================================== */}
        <aside className="w-full lg:w-[370px] xl:w-[410px] shrink-0 border-l border-white/10 bg-[#0e1014] flex flex-col overflow-y-auto">
          {/* Subview Tabs: Cinematography / Spatial / Story / Locks */}
          <div className="p-2 border-b border-white/10 bg-[#12141a] flex items-center justify-between gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTabSubView('cinematography')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTabSubView === 'cinematography' ? 'bg-white/20 text-white font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              Cinematography
            </button>
            <button
              onClick={() => setActiveTabSubView('locks')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTabSubView === 'locks' ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30' : 'text-white/50 hover:text-white'
              }`}
            >
              12 Invariant Locks
            </button>
            <button
              onClick={() => setActiveTabSubView('spatial')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTabSubView === 'spatial' ? 'bg-white/20 text-white font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              Spatial Engine
            </button>
            <button
              onClick={() => setActiveTabSubView('story')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTabSubView === 'story' ? 'bg-white/20 text-white font-semibold' : 'text-white/50 hover:text-white'
              }`}
            >
              Story State
            </button>
          </div>

          <div className="p-4 space-y-6 flex-1">
            {/* Post-Gen Multi-Axis Diagnostic Report Card */}
            {currentFrame?.continuityReport && (
              <div className="bg-[#141720] border border-white/10 rounded-xl p-3.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-semibold text-white uppercase tracking-wider font-mono-data flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Continuity Diagnostic Matrix</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono-data font-semibold">
                    Separate Metrics
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono-data">
                  <div className="bg-[#191d28] p-2 rounded border border-white/5">
                    <div className="text-[10px] text-white/40">Identity</div>
                    <div className="text-emerald-400 font-bold">{currentFrame.continuityReport.identityScore}% Match</div>
                  </div>
                  <div className="bg-[#191d28] p-2 rounded border border-white/5">
                    <div className="text-[10px] text-white/40">Wardrobe Weave</div>
                    <div className="text-emerald-400 font-bold">{currentFrame.continuityReport.wardrobeScore}% Locked</div>
                  </div>
                  <div className="bg-[#191d28] p-2 rounded border border-white/5">
                    <div className="text-[10px] text-white/40">Location Architecture</div>
                    <div className="text-amber-300 font-bold">{currentFrame.continuityReport.locationScore}% Coherent</div>
                  </div>
                  <div className="bg-[#191d28] p-2 rounded border border-white/5">
                    <div className="text-[10px] text-white/40">Lighting Motivation</div>
                    <div className="text-cyan-400 font-bold">{currentFrame.continuityReport.lightingScore}% Angle</div>
                  </div>
                  <div className="bg-[#191d28] p-2 rounded border border-white/5">
                    <div className="text-[10px] text-white/40">Spatial Plane</div>
                    <div className="text-emerald-400 font-bold">{currentFrame.continuityReport.spatialScore}% 3D Depth</div>
                  </div>
                  <div className="bg-[#191d28] p-2 rounded border border-white/5">
                    <div className="text-[10px] text-white/40">Hero Props</div>
                    <div className="text-emerald-400 font-bold">{currentFrame.continuityReport.propScore}% Consistent</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: 12 GRANULAR INVARIANT LOCKS */}
            {activeTabSubView === 'locks' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono-data">
                    12 Granular Continuity Locks
                  </span>
                  <span className="text-[10px] text-white/40">Independent Toggles</span>
                </div>
                <p className="text-[11px] text-white/50">
                  Unlock an individual element when intentionally modifying it (e.g. changing wardrobe while preserving facial identity and lighting).
                </p>

                <div className="space-y-1.5">
                  {[
                    { key: 'identity' as const, label: 'LOCK IDENTITY', desc: 'Preserves bone structure, ethnicity & facial landmarks' },
                    { key: 'face' as const, label: 'LOCK FACE', desc: 'Preserves eye shape, nose bridge & facial geometry' },
                    { key: 'hair' as const, label: 'LOCK HAIR', desc: 'Preserves hair texture, braids & hairline' },
                    { key: 'wardrobe' as const, label: 'LOCK WARDROBE', desc: 'Preserves cardigan fabric weave & garments' },
                    { key: 'location' as const, label: 'LOCK LOCATION', desc: 'Preserves physical room & surrounding environment' },
                    { key: 'architecture' as const, label: 'LOCK ARCHITECTURE', desc: 'Preserves window, door, and wall coordinates' },
                    { key: 'prop' as const, label: 'LOCK PROP', desc: 'Preserves silver whistle locket engraving & wear' },
                    { key: 'lighting' as const, label: 'LOCK LIGHTING', desc: 'Preserves key light angle & contrast ratio' },
                    { key: 'time' as const, label: 'LOCK TIME', desc: 'Preserves time of day & solar elevation' },
                    { key: 'weather' as const, label: 'LOCK WEATHER', desc: 'Preserves fog/rain atmospheric condition' },
                    { key: 'composition' as const, label: 'LOCK COMPOSITION', desc: 'Preserves framing, rule-of-thirds eye-lines' },
                    { key: 'visualStyle' as const, label: 'LOCK VISUAL STYLE', desc: 'Preserves 35mm grain & Kodak Vision3 LUT' },
                  ].map((item) => {
                    const isLocked = activeScene.locks[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleLock(item.key)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isLocked
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-[#14171e] border-white/5 text-white/40 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold font-mono-data flex items-center gap-1.5">
                            {isLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-white/30" />}
                            <span>{item.label}</span>
                          </div>
                          <div className="text-[10px] text-white/50 mt-0.5">{item.desc}</div>
                        </div>
                        <span className={`text-[10px] font-mono-data font-bold px-1.5 py-0.5 rounded ${
                          isLocked ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/30'
                        }`}>
                          {isLocked ? 'LOCKED' : 'OPEN'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: SPATIAL CONTINUITY ENGINE */}
            {activeTabSubView === 'spatial' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono-data">
                    3D Spatial Awareness
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono-data">Physical Geometry</span>
                </div>

                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">
                    Camera Distance & Angle
                  </label>
                  <input
                    type="text"
                    value={activeScene.spatialState?.cameraPlacementDescription || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        spatialState: {
                          ...activeScene.spatialState,
                          cameraPlacementDescription: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">
                    Door Relationships
                  </label>
                  <input
                    type="text"
                    value={activeScene.spatialState?.doorRelationships || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        spatialState: {
                          ...activeScene.spatialState,
                          doorRelationships: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">
                    Window Relationships
                  </label>
                  <input
                    type="text"
                    value={activeScene.spatialState?.windowRelationships || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        spatialState: {
                          ...activeScene.spatialState,
                          windowRelationships: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">
                    Key Furniture Arrangement
                  </label>
                  <input
                    type="text"
                    value={activeScene.spatialState?.furniturePositions || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        spatialState: {
                          ...activeScene.spatialState,
                          furniturePositions: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: STORY STATE */}
            {activeTabSubView === 'story' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-white/10">
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono-data">
                    Story Arc Progression
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono-data">Narrative Continuity</span>
                </div>

                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">
                    Previous Event (What Happened Immediately Before)
                  </label>
                  <textarea
                    rows={2}
                    value={activeScene.storyState?.previousEvent || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        storyState: {
                          ...activeScene.storyState,
                          previousEvent: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">
                    Current Event (What Occurs in this Scene)
                  </label>
                  <textarea
                    rows={2}
                    value={activeScene.storyState?.currentEvent || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        storyState: {
                          ...activeScene.storyState,
                          currentEvent: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">
                    Next Event (What the Following Scene Requires)
                  </label>
                  <textarea
                    rows={2}
                    value={activeScene.storyState?.nextEvent || ''}
                    onChange={(e) =>
                      onUpdateScene({
                        ...activeScene,
                        storyState: {
                          ...activeScene.storyState,
                          nextEvent: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: CINEMATOGRAPHY & LIGHTING CONTROLS */}
            {activeTabSubView === 'cinematography' && (
              <div className="space-y-5">
                {/* Shot Type */}
                <div>
                  <label className="block text-[11px] text-white/50 mb-1 font-mono-data">Shot Type</label>
                  <select
                    value={activeScene.cinematography.shotType}
                    onChange={(e) => updateCinematography('shotType', e.target.value)}
                    className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                  >
                    {shotTypes.map((st) => (
                      <option key={st} value={st} className="bg-[#14171e]">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lens */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-white/50 font-mono-data">Cinema Prime Lens</label>
                    <span className="text-[10px] text-amber-400 font-mono-data">
                      {activeScene.cinematography.lens}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                    {lenses.map((l) => (
                      <button
                        key={l}
                        onClick={() => updateCinematography('lens', l)}
                        className={`py-1.5 rounded text-[11px] font-mono-data transition-colors border ${
                          activeScene.cinematography.lens === l
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                            : 'bg-[#14171e] text-white/50 border-white/5 hover:text-white'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Camera Angle & Movement */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-white/50 mb-1 font-mono-data">Camera Angle</label>
                    <select
                      value={activeScene.cinematography.cameraAngle}
                      onChange={(e) => updateCinematography('cameraAngle', e.target.value)}
                      className="w-full bg-[#14171e] border border-white/10 rounded p-1.5 text-xs text-white"
                    >
                      {cameraAngles.map((ca) => (
                        <option key={ca} value={ca} className="bg-[#14171e]">
                          {ca}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1 font-mono-data">Movement / Comp</label>
                    <select
                      value={activeScene.cinematography.cameraMovement}
                      onChange={(e) => updateCinematography('cameraMovement', e.target.value)}
                      className="w-full bg-[#14171e] border border-white/10 rounded p-1.5 text-xs text-white"
                    >
                      {cameraMovements.map((cm) => (
                        <option key={cm} value={cm} className="bg-[#14171e]">
                          {cm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lighting Preset & Key Light Direction */}
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white/80 font-mono-data">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lighting Design</span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1 font-mono-data">Lighting Preset</label>
                    <select
                      value={activeScene.lighting.preset}
                      onChange={(e) => updateLighting('preset', e.target.value)}
                      className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                    >
                      {lightingPresets.map((lp) => (
                        <option key={lp} value={lp} className="bg-[#14171e]">
                          {lp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-white/50 mb-1 font-mono-data">Key Light Direction</label>
                    <select
                      value={activeScene.lighting.keyLightDirection}
                      onChange={(e) => updateLighting('keyLightDirection', e.target.value)}
                      className="w-full bg-[#14171e] border border-white/10 rounded p-2 text-xs text-white"
                    >
                      {keyDirections.map((kd) => (
                        <option key={kd} value={kd} className="bg-[#14171e]">
                          {kd}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ======================================================== */}
      {/* PRE-GENERATION CONTINUITY CONFLICT RESOLUTION MODAL      */}
      {/* ======================================================== */}
      {showPreGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6">
          <div className="relative w-full max-w-2xl bg-[#111319] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#161822]">
              <div className="flex items-center gap-2 font-mono-data text-xs text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>PRE-GENERATION CONTINUITY CONFLICT AUDIT</span>
              </div>
              <button
                onClick={() => setShowPreGenModal(false)}
                className="px-2 py-1 text-xs text-white/50 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 max-h-[75vh]">
              <p className="text-xs text-white/70 leading-relaxed">
                Before generating the new take, CineFrame AI verified your parameters against approved scene state{' '}
                <span className="font-mono-data text-amber-400 font-bold">{previousSnapshot?.sceneId || 'Master'}</span>.
              </p>

              <div className="space-y-3">
                {preGenAnalysis.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                      chk.status === 'conflict'
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : chk.status === 'info'
                        ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
                        : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5 font-mono-data">
                        {chk.status === 'conflict' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        ) : chk.status === 'info' ? (
                          <Info className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{chk.label}</span>
                      </span>
                      <span className="text-[10px] uppercase font-mono-data">{chk.status}</span>
                    </div>

                    <p className="text-[11px] text-white/80 leading-relaxed">{chk.explanation}</p>

                    {chk.status === 'conflict' && (
                      <div className="pt-2 flex items-center gap-2 border-t border-white/10">
                        <button
                          onClick={() => {
                            if (chk.category === 'lighting' && previousSnapshot) {
                              updateLighting('keyLightDirection', previousSnapshot.lightingState.keyLightDirection);
                            } else if (chk.category === 'weather' && previousSnapshot) {
                              onUpdateScene({ ...activeScene, weather: previousSnapshot.weather });
                            }
                          }}
                          className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded text-[11px] font-medium"
                        >
                          Keep Previous
                        </button>
                        <button
                          onClick={() => {
                            // Apply new change: user acknowledges intentional evolution
                          }}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-medium border border-amber-500/40"
                        >
                          Apply New Change (Intentional)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#161822] flex items-center justify-between">
              <span className="text-xs text-white/50">
                You retain ultimate directorial authority over all scene transitions.
              </span>
              <button
                onClick={() => executeGeneration(1)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-colors"
              >
                Proceed with Generation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SNAPSHOT INSPECTOR MODAL                                 */}
      {/* ======================================================== */}
      {showSnapshotInspector && previousSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6">
          <div className="relative w-full max-w-2xl bg-[#111319] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#161822]">
              <div className="flex items-center gap-2 font-mono-data text-xs text-amber-400">
                <History className="w-4 h-4" />
                <span>Scene State Snapshot: {previousSnapshot.sceneId} (Approved Anchor)</span>
              </div>
              <button
                onClick={() => setShowSnapshotInspector(false)}
                className="px-2 py-1 text-xs text-white/50 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono-data">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#161822] p-3 rounded">
                  <span className="text-[10px] text-white/40 block">Approved Location</span>
                  <span className="text-white font-medium">{previousSnapshot.locationState.locationName}</span>
                </div>
                <div className="bg-[#161822] p-3 rounded">
                  <span className="text-[10px] text-white/40 block">Lighting Preset & Key</span>
                  <span className="text-white font-medium">
                    {previousSnapshot.lightingState.preset} ({previousSnapshot.lightingState.keyLightDirection})
                  </span>
                </div>
              </div>

              <div className="bg-[#161822] p-3 rounded space-y-1">
                <span className="text-[10px] text-white/40 block">Character Biometrics & Wardrobe</span>
                {previousSnapshot.characterStates.map((cs) => (
                  <div key={cs.characterId} className="text-white">
                    <span className="text-amber-400 font-bold">{cs.characterName}:</span> {cs.wardrobeDescription} ({cs.hairCondition})
                  </div>
                ))}
              </div>

              <div className="bg-[#161822] p-3 rounded space-y-1">
                <span className="text-[10px] text-white/40 block">Spatial Layout</span>
                <p className="text-white/80">{previousSnapshot.spatialState?.cameraPlacementDescription}</p>
                <p className="text-white/60 text-[11px]">{previousSnapshot.spatialState?.doorRelationships}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
