import React, { useState, useMemo } from 'react';
import {
  Project,
  Scene,
  GeneratedFrame,
  AspectRatio,
  Character,
  Location,
  Prop,
  VisualDNA,
} from './types/cinema';
import { createInitialProject } from './data/sampleProject';
import { Navbar, ActiveTab } from './components/Navbar';
import { GenerationWorkspace } from './components/GenerationWorkspace';
import { VisualBibleBuilder } from './components/VisualBibleBuilder';
import { TimelineView } from './components/TimelineView';
import { CharacterLibrary } from './components/CharacterLibrary';
import { LocationLibrary } from './components/LocationLibrary';
import { PropLibrary } from './components/PropLibrary';
import { ContinuityHub } from './components/ContinuityHub';
import { GalleryView } from './components/GalleryView';
import { ComparisonModal } from './components/ComparisonModal';
import { ExportModal } from './components/ExportModal';
import { NewMovieModal } from './components/NewMovieModal';
import {
  runContinuityAudit,
  createSceneStateSnapshot,
  inheritFromPreviousScene,
  detectSceneBridgeRequirement,
} from './utils/continuityEngine';

export default function App() {
  // Multi-Movie Persistent Projects Collection
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('cineframe_projects_collection');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Failed to parse saved projects collection:', e);
      }
    }
    // Check legacy single project save
    const singleSaved = localStorage.getItem('cineframe_project_state');
    if (singleSaved) {
      try {
        const parsed = JSON.parse(singleSaved);
        if (parsed?.id) return [parsed];
      } catch (e) {
        console.warn('Failed to parse single saved project:', e);
      }
    }
    return [createInitialProject()];
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return projects[0]?.id || 'project-1';
  });

  // Current Active Project pointer
  const project = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0];
  }, [projects, activeProjectId]);

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    return project?.productionStage === 'bible' && !project?.visualBibleLocked
      ? 'visual-bible'
      : 'generate';
  });

  const [activeSceneId, setActiveSceneId] = useState<string>(() => {
    return project.scenes[0]?.id || 'scene-1';
  });

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '16:9');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showFalseColor, setShowFalseColor] = useState<boolean>(false);
  const [comparisonPair, setComparisonPair] = useState<{ frameA: GeneratedFrame; frameB: GeneratedFrame } | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [isNewMovieModalOpen, setIsNewMovieModalOpen] = useState<boolean>(false);

  // Active scene pointer
  const activeScene = useMemo(() => {
    return project.scenes.find((s) => s.id === activeSceneId) || project.scenes[0];
  }, [project.scenes, activeSceneId]);

  // Run Real-Time Continuity Audit for current project
  const continuityWarnings = useMemo(() => {
    if (!activeScene) return [];
    return runContinuityAudit(
      activeScene,
      project.scenes,
      project.characters,
      project.locations,
      project.props,
      project.generatedFrames
    );
  }, [activeScene, project]);

  // Persist project changes across projects collection
  const updateProject = (updated: Project) => {
    const updatedProjects = projects.map((p) => (p.id === updated.id ? updated : p));
    setProjects(updatedProjects);
    try {
      localStorage.setItem('cineframe_projects_collection', JSON.stringify(updatedProjects));
      localStorage.setItem('cineframe_project_state', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Create and switch to new project
  const handleCreateProject = (newProject: Project) => {
    const updated = [newProject, ...projects];
    setProjects(updated);
    setActiveProjectId(newProject.id);
    setActiveTab('visual-bible'); // First step: Stage 1 - Build Visual Bible
    try {
      localStorage.setItem('cineframe_projects_collection', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Lock Visual Bible and advance to Scene Generation
  const handleLockVisualBible = () => {
    let scenes = project.scenes;
    let targetSceneId = activeSceneId;

    // Seed initial scene if empty
    if (scenes.length === 0) {
      const initialScene: Scene = {
        id: `scene-${Date.now()}`,
        sceneId: 'EP1-001',
        episode: 'EP1',
        title: 'Scene 1',
        description: 'Describe what occurs in this scene image.',
        characterIds: project.characters.slice(0, 1).map((c) => c.id),
        locationId: project.locations[0]?.id || '',
        propIds: [],
        time: 'Morning',
        weather: 'Clear',
        emotion: 'Tension',
        status: 'draft',
        isApproved: false,
        locks: {
          identity: true,
          face: true,
          hair: true,
          wardrobe: true,
          location: true,
          architecture: true,
          prop: true,
          lighting: true,
          time: true,
          weather: true,
          composition: true,
          visualStyle: true,
        },
        cinematography: {
          shotType: 'Medium Shot',
          cameraAngle: 'Eye level',
          cameraMovement: 'Static',
          lens: '50mm',
          depthOfField: 'Shallow depth',
          focusTarget: 'Character',
        },
        lighting: {
          preset: 'Natural daylight',
          keyLightDirection: 'Camera Left 45°',
          fillIntensity: 30,
          backlight: 30,
          contrastRatio: 'Moderate 4:1',
          shadowDensity: 'Soft diffuse',
          colorTemperature: '5600K Daylight',
          ambientLight: 25,
        },
        spatialState: {
          characterPlacements: [],
          cameraPlacementDescription: 'Eye level 2.5m away',
          doorRelationships: 'Door to frame right',
          windowRelationships: 'Window behind subject',
          furniturePositions: 'Standard staging',
        },
        storyState: {
          previousEvent: 'Opening moment',
          currentEvent: 'Introduction',
          nextEvent: 'Following sequence',
        },
        characterStates: [],
        createdAt: Date.now(),
      };
      scenes = [initialScene];
      targetSceneId = initialScene.id;
      setActiveSceneId(initialScene.id);
    }

    updateProject({
      ...project,
      scenes,
      productionStage: 'production',
      visualBibleLocked: true,
    });
    setActiveTab('generate');
  };

  // Scene Operations
  const handleUpdateScene = (updatedScene: Scene) => {
    const updatedScenes = project.scenes.map((s) => (s.id === updatedScene.id ? updatedScene : s));
    updateProject({ ...project, scenes: updatedScenes });
  };

  // Human Approval Gate: Approves scene and creates persistent snapshot
  const handleApproveScene = (sceneId: string, frameId?: string) => {
    const targetScene = project.scenes.find((s) => s.id === sceneId);
    if (!targetScene) return;

    const frame = frameId
      ? project.generatedFrames.find((f) => f.id === frameId)
      : project.generatedFrames.find((f) => f.sceneId === sceneId);

    const loc = project.locations.find((l) => l.id === targetScene.locationId);
    const sceneProps = project.props.filter((p) => targetScene.propIds.includes(p.id));

    const dummyFrame: GeneratedFrame = frame || {
      id: `frame-${Date.now()}`,
      sceneId: targetScene.id,
      projectId: project.id,
      episode: targetScene.episode,
      url: '',
      prompt: targetScene.description,
      negativePrompt: '',
      cinematography: targetScene.cinematography,
      lighting: targetScene.lighting,
      characterIds: targetScene.characterIds,
      locationId: targetScene.locationId,
      propIds: targetScene.propIds,
      aspectRatio: project.aspectRatio,
      provider: 'Procedural Synthesizer',
      timestamp: Date.now(),
      isMasterFrame: true,
      isApproved: true,
      locks: targetScene.locks,
      continuityStatus: 'passed',
      continuityWarnings: [],
    };

    const snapshot = createSceneStateSnapshot(
      targetScene,
      dummyFrame,
      project.characters,
      loc,
      sceneProps
    );

    const updatedScenes = project.scenes.map((s) => {
      if (s.id === sceneId) {
        return {
          ...s,
          isApproved: true,
          status: 'approved' as const,
          approvedSnapshot: snapshot,
          masterFrameId: frame?.id || s.masterFrameId,
        };
      }
      return s;
    });

    const updatedFrames = project.generatedFrames.map((f) => {
      if (frame && f.id === frame.id) {
        return { ...f, isMasterFrame: true };
      }
      return f;
    });

    const updatedSnapshots = [...(project.stateSnapshots || []).filter((snap) => snap.sceneId !== sceneId), snapshot];

    updateProject({
      ...project,
      scenes: updatedScenes,
      generatedFrames: updatedFrames,
      stateSnapshots: updatedSnapshots,
    });
  };

  // Continue from previous approved scene
  const handleContinueFromPreviousScene = (prevScene: Scene) => {
    if (!activeScene) return;
    const prevSnapshot = prevScene.approvedSnapshot || null;
    const loc = project.locations.find((l) => l.id === prevScene.locationId);
    const sceneProps = project.props.filter((p) => prevScene.propIds.includes(p.id));

    const inherited = inheritFromPreviousScene(
      activeScene.sceneId,
      prevScene,
      prevSnapshot,
      project.characters,
      loc,
      sceneProps
    );

    const updated: Scene = {
      ...activeScene,
      ...inherited,
    };
    handleUpdateScene(updated);
  };

  // Create transition scene to bridge continuity gap
  const handleCreateTransitionScene = (sceneA: Scene, sceneB: Scene) => {
    const bridge = detectSceneBridgeRequirement(sceneA, sceneB);
    const newSceneId = `EP1-${String(project.scenes.length + 1).padStart(3, '0')}`;
    const transitionScene: Scene = {
      id: `scene-${Date.now()}`,
      sceneId: newSceneId,
      episode: 'EP1',
      title: `Transition: ${sceneA.sceneId} to ${sceneB.sceneId}`,
      description: bridge.suggestedAction || `Transitional bridge shot linking ${sceneA.sceneId} and ${sceneB.sceneId}.`,
      characterIds: [...sceneA.characterIds],
      locationId: sceneA.locationId,
      propIds: [...sceneA.propIds],
      time: sceneA.time,
      weather: sceneA.weather,
      emotion: sceneA.emotion,
      status: 'draft',
      isApproved: false,
      locks: { ...sceneA.locks },
      cinematography: {
        ...sceneA.cinematography,
        shotType: bridge.suggestedShotType || 'Wide Shot',
      },
      lighting: { ...sceneA.lighting },
      spatialState: { ...sceneA.spatialState },
      storyState: {
        previousEvent: sceneA.description,
        currentEvent: bridge.suggestedAction || 'Transitional bridge',
        nextEvent: sceneB.description,
      },
      characterStates: [...sceneA.characterStates],
      createdAt: Date.now(),
    };

    updateProject({
      ...project,
      scenes: [...project.scenes, transitionScene],
    });
    setActiveSceneId(transitionScene.id);
    setActiveTab('generate');
  };

  // Auto-correct minor drift
  const handleCorrectInconsistency = (warningId: string) => {
    const warning = continuityWarnings.find((w) => w.id === warningId);
    if (!warning || !activeScene) return;

    if (warning.type === 'lighting') {
      const prevScene = project.scenes.find((s) => s.sceneId === warning.compareSceneId);
      if (prevScene) {
        handleUpdateScene({
          ...activeScene,
          lighting: {
            ...activeScene.lighting,
            keyLightDirection: prevScene.lighting.keyLightDirection,
            colorTemperature: prevScene.lighting.colorTemperature,
          },
        });
      }
    } else if (warning.type === 'wardrobe') {
      const char = project.characters.find((c) => c.id === warning.characterId);
      if (char) {
        handleUpdateScene({
          ...activeScene,
          description: `${activeScene.description} (Preserving ${char.name}'s canonical wardrobe: ${char.clothing})`,
        });
      }
    }
  };

  const handleAddScene = () => {
    const nextNumber = project.scenes.length + 1;
    const formattedId = `EP1-${String(nextNumber).padStart(3, '0')}`;
    const lastScene = project.scenes[project.scenes.length - 1];

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      sceneId: formattedId,
      episode: 'EP1',
      title: `Scene ${nextNumber}`,
      description: 'Describe the action, character motivation, and visual focus for this setup.',
      characterIds: lastScene ? [...lastScene.characterIds] : project.characters.slice(0, 1).map((c) => c.id),
      locationId: lastScene ? lastScene.locationId : project.locations[0]?.id || '',
      propIds: lastScene ? [...lastScene.propIds] : [],
      time: lastScene ? lastScene.time : 'Late Afternoon',
      weather: lastScene ? lastScene.weather : 'Overcast / Soft Daylight',
      emotion: 'Tense anticipation',
      status: 'draft',
      isApproved: false,
      characterStates: lastScene ? [...lastScene.characterStates] : [],
      locks: { ...(lastScene?.locks || {
        identity: true,
        face: true,
        hair: true,
        wardrobe: true,
        location: true,
        architecture: true,
        prop: true,
        lighting: true,
        time: true,
        weather: true,
        composition: true,
        visualStyle: true,
      }) },
      cinematography: lastScene
        ? { ...lastScene.cinematography, shotType: 'Medium Shot' }
        : {
            shotType: 'Medium Shot',
            cameraAngle: 'Eye level',
            cameraMovement: 'Static',
            lens: '50mm',
            depthOfField: 'Shallow depth',
            focusTarget: 'Character',
          },
      lighting: lastScene
        ? { ...lastScene.lighting }
        : {
            preset: 'Soft window light',
            keyLightDirection: 'Camera Left 45°',
            fillIntensity: 30,
            backlight: 40,
            contrastRatio: 'Moderate 4:1',
            shadowDensity: 'Soft diffuse',
            colorTemperature: '5600K Daylight',
            ambientLight: 25,
          },
      spatialState: lastScene?.spatialState
        ? { ...lastScene.spatialState }
        : {
            characterPlacements: [],
            cameraPlacementDescription: 'Eye level 2.5m away',
            doorRelationships: 'Door to frame right',
            windowRelationships: 'Window behind subject',
            furniturePositions: 'Standard living room arrangement',
            characterPositions: 'Subject standing near room center',
            environmentalAnchors: 'Visible door to right, window behind',
            cameraDistanceMeters: 2.5,
          },
      storyState: lastScene?.storyState
        ? { ...lastScene.storyState }
        : {
            previousEvent: 'Opening sequence',
            currentEvent: 'Action progression',
            nextEvent: 'Following scene resolution',
            narrativeMoment: `Sequential beat following ${lastScene ? lastScene.sceneId : 'opening setup'}`,
          },
      createdAt: Date.now(),
    };

    updateProject({
      ...project,
      scenes: [...project.scenes, newScene],
    });
    setActiveSceneId(newScene.id);
    setActiveTab('generate');
  };

  const handleDuplicateScene = (sceneToDuplicate: Scene) => {
    const nextNumber = project.scenes.length + 1;
    const formattedId = `EP1-${String(nextNumber).padStart(3, '0')}`;
    const duplicated: Scene = {
      ...sceneToDuplicate,
      id: `scene-${Date.now()}`,
      sceneId: formattedId,
      title: `${sceneToDuplicate.title} (Take 2)`,
      status: 'draft',
      approvedSnapshot: undefined,
      createdAt: Date.now(),
    };

    updateProject({
      ...project,
      scenes: [...project.scenes, duplicated],
    });
    setActiveSceneId(duplicated.id);
    setActiveTab('generate');
  };

  // Frame Operations
  const handleSetMasterFrame = (frame: GeneratedFrame) => {
    const updatedFrames = project.generatedFrames.map((f) => ({
      ...f,
      isMasterFrame: f.id === frame.id ? !frame.isMasterFrame : f.sceneId === frame.sceneId ? false : f.isMasterFrame,
    }));

    const updatedScenes = project.scenes.map((s) => {
      if (s.id === frame.sceneId) {
        return {
          ...s,
          masterFrameId: frame.isMasterFrame ? undefined : frame.id,
        };
      }
      return s;
    });

    updateProject({
      ...project,
      generatedFrames: updatedFrames,
      scenes: updatedScenes,
    });
  };

  const handleSaveFrame = (newFrame: GeneratedFrame) => {
    const exists = project.generatedFrames.some((f) => f.id === newFrame.id);
    if (!exists) {
      updateProject({
        ...project,
        generatedFrames: [newFrame, ...project.generatedFrames],
      });
    }
  };

  // Character Operations
  const handleUpdateCharacter = (char: Character) => {
    const updated = project.characters.map((c) => (c.id === char.id ? char : c));
    updateProject({ ...project, characters: updated });
  };

  const handleAddCharacter = (char: Character) => {
    updateProject({ ...project, characters: [...project.characters, char] });
  };

  const handleDeleteCharacter = (charId: string) => {
    updateProject({
      ...project,
      characters: project.characters.filter((c) => c.id !== charId),
    });
  };

  // Location Operations
  const handleUpdateLocation = (loc: Location) => {
    const updated = project.locations.map((l) => (l.id === loc.id ? loc : l));
    updateProject({ ...project, locations: updated });
  };

  const handleAddLocation = (loc: Location) => {
    updateProject({ ...project, locations: [...project.locations, loc] });
  };

  const handleDeleteLocation = (locId: string) => {
    updateProject({
      ...project,
      locations: project.locations.filter((l) => l.id !== locId),
    });
  };

  // Prop Operations
  const handleUpdateProp = (prop: Prop) => {
    const updated = project.props.map((p) => (p.id === prop.id ? prop : p));
    updateProject({ ...project, props: updated });
  };

  const handleAddProp = (prop: Prop) => {
    updateProject({ ...project, props: [...project.props, prop] });
  };

  const handleDeleteProp = (propId: string) => {
    updateProject({
      ...project,
      props: project.props.filter((p) => p.id !== propId),
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07080a] text-[#e2e4e9] overflow-hidden select-none">
      {/* Top Universal Cinema Navbar */}
      <Navbar
        project={project}
        allProjects={projects}
        onSelectProject={(pId) => {
          setActiveProjectId(pId);
          const target = projects.find((p) => p.id === pId);
          if (target && target.scenes.length > 0) {
            setActiveSceneId(target.scenes[0].id);
          }
        }}
        onOpenNewMovie={() => setIsNewMovieModalOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showFalseColor={showFalseColor}
        onToggleFalseColor={() => setShowFalseColor(!showFalseColor)}
        onOpenExport={() => setShowExportModal(true)}
        continuityWarningCount={continuityWarnings.length}
      />

      {/* Main Dynamic View Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Stage 1: Build the Movie Visual Bible */}
        {activeTab === 'visual-bible' && (
          <VisualBibleBuilder
            project={project}
            onUpdateProject={updateProject}
            onLockVisualBible={handleLockVisualBible}
          />
        )}

        {/* Stage 2: Scene Generation Workspace */}
        {activeTab === 'generate' && activeScene && (
          <GenerationWorkspace
            project={project}
            activeScene={activeScene}
            onSceneChange={(s) => setActiveSceneId(s.id)}
            onUpdateScene={handleUpdateScene}
            aspectRatio={aspectRatio}
            showGrid={showGrid}
            showFalseColor={showFalseColor}
            onSetMasterFrame={handleSetMasterFrame}
            onCompareFrames={(fA, fB) => setComparisonPair({ frameA: fA, frameB: fB })}
            onSaveFrame={handleSaveFrame}
            onContinueFromPreviousScene={handleContinueFromPreviousScene}
            onCreateTransitionScene={handleCreateTransitionScene}
            onApproveScene={(scene, frame) => handleApproveScene(scene.id, frame.id)}
            continuityWarnings={continuityWarnings}
            onOpenVisualBible={() => setActiveTab('visual-bible')}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            project={project}
            onSelectScene={(s) => {
              setActiveSceneId(s.id);
              setActiveTab('generate');
            }}
            onAddScene={handleAddScene}
            onDuplicateScene={handleDuplicateScene}
            onCompareFrames={(fA, fB) => setComparisonPair({ frameA: fA, frameB: fB })}
          />
        )}

        {activeTab === 'characters' && (
          <CharacterLibrary
            project={project}
            onUpdateCharacter={handleUpdateCharacter}
            onAddCharacter={handleAddCharacter}
            onDeleteCharacter={handleDeleteCharacter}
          />
        )}

        {activeTab === 'locations' && (
          <LocationLibrary
            project={project}
            onUpdateLocation={handleUpdateLocation}
            onAddLocation={handleAddLocation}
            onDeleteLocation={handleDeleteLocation}
          />
        )}

        {activeTab === 'props' && (
          <PropLibrary
            project={project}
            onUpdateProp={handleUpdateProp}
            onAddProp={handleAddProp}
            onDeleteProp={handleDeleteProp}
          />
        )}

        {activeTab === 'continuity' && (
          <ContinuityHub
            project={project}
            onSelectScene={(s) => {
              setActiveSceneId(s.id);
              setActiveTab('generate');
            }}
            onCompareFrames={(fA, fB) => setComparisonPair({ frameA: fA, frameB: fB })}
            warnings={continuityWarnings}
            onCorrectInconsistency={handleCorrectInconsistency}
          />
        )}

        {activeTab === 'gallery' && (
          <GalleryView
            project={project}
            onSelectScene={(s) => {
              setActiveSceneId(s.id);
              setActiveTab('generate');
            }}
            onSetMasterFrame={handleSetMasterFrame}
            onCompareFrames={(fA, fB) => setComparisonPair({ frameA: fA, frameB: fB })}
          />
        )}
      </div>

      {/* Comparison Modal */}
      {comparisonPair && (
        <ComparisonModal
          frameA={comparisonPair.frameA}
          frameB={comparisonPair.frameB}
          onClose={() => setComparisonPair(null)}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          project={project}
          activeFrame={project.generatedFrames.find((f) => f.sceneId === activeScene.id)}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* New Movie Modal */}
      <NewMovieModal
        isOpen={isNewMovieModalOpen}
        onClose={() => setIsNewMovieModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
