export type AspectRatio = '16:9' | '2.39:1' | '1.85:1' | '4:3' | '9:16' | '1:1';

export type ShotType =
  | 'Extreme Wide Shot'
  | 'Wide Shot'
  | 'Full Shot'
  | 'Medium Wide'
  | 'Medium Shot'
  | 'Medium Close-Up'
  | 'Close-Up'
  | 'Extreme Close-Up'
  | 'Over-the-Shoulder'
  | 'Two Shot'
  | 'POV'
  | 'Insert Shot'
  | 'Establishing Shot';

export type CameraAngle =
  | 'Eye level'
  | 'Low angle'
  | 'High angle'
  | 'Dutch angle'
  | 'Overhead'
  | 'Ground level';

export type CameraMovement =
  | 'Static'
  | 'Tracking composition'
  | 'Push-in composition'
  | 'Pull-back composition'
  | 'Handheld'
  | 'Steadicam'
  | 'Crane perspective';

export type LensFocalLength =
  | '18mm'
  | '24mm'
  | '28mm'
  | '35mm'
  | '50mm'
  | '85mm'
  | '135mm';

export type DepthOfField =
  | 'Deep focus'
  | 'Moderate depth'
  | 'Shallow depth'
  | 'Extremely shallow cinematic depth';

export type FocusTarget =
  | 'Character'
  | 'Object'
  | 'Background'
  | 'Foreground'
  | 'Rack-focus composition';

export type LightingPreset =
  | 'Natural daylight'
  | 'Soft window light'
  | 'Overcast'
  | 'Golden hour'
  | 'Blue hour'
  | 'Practical interior lighting'
  | 'Tungsten'
  | 'Fluorescent'
  | 'Candlelight'
  | 'Moonlight'
  | 'Dramatic side lighting'
  | 'Low-key cinematic'
  | 'High-key cinematic';

export type KeyLightDirection =
  | 'Camera Left 45°'
  | 'Camera Right 45°'
  | 'Direct Front'
  | 'Back-rim'
  | 'Overhead'
  | 'Low-angle up';

export type FilmLook =
  | 'Contemporary drama'
  | 'Thriller'
  | 'Mystery'
  | 'Crime'
  | 'Documentary'
  | 'Historical'
  | 'Romance'
  | 'Psychological drama'
  | 'Action'
  | 'Sci-fi'
  | 'Horror';

export type ColorLanguage =
  | 'Neutral'
  | 'Warm'
  | 'Cool'
  | 'Desaturated'
  | 'High contrast'
  | 'Muted'
  | 'Naturalistic'
  | 'Filmic';

export type Texture =
  | 'Clean digital cinema'
  | 'Subtle film grain'
  | '35mm film texture'
  | '16mm documentary texture';

export interface CinematographySettings {
  shotType: ShotType;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  lens: LensFocalLength;
  depthOfField: DepthOfField;
  focusTarget: FocusTarget;
}

export interface LightingSettings {
  preset: LightingPreset;
  keyLightDirection: KeyLightDirection;
  fillIntensity: number; // 0 to 100
  backlight: number; // 0 to 100
  contrastRatio: 'Low 2:1' | 'Moderate 4:1' | 'High 8:1' | 'Extreme 16:1';
  shadowDensity: 'Soft diffuse' | 'Deep black' | 'Tinted ambient';
  colorTemperature: string; // e.g. "3200K Tungsten", "5600K Daylight"
  ambientLight: number; // 0 to 100
}

export interface VisualDNA {
  realism: 'Photorealistic';
  filmLook: FilmLook;
  colorLanguage: ColorLanguage;
  texture: Texture;
  cameraPhilosophy: string;
  lensLanguage: string;
  negativeConstraints: string[];
  masterPrompt?: string; // Master cinematic prompt text
}

// Reference Priority Hierarchy (Level 1 to 4)
export type ReferenceHierarchyLevel = 1 | 2 | 3 | 4;
export type ReferenceRole =
  | 'identity' // Level 1: Character identity & biometric preservation
  | 'location' // Level 2: Location architecture & spatial geometry
  | 'master_frame' // Level 3: Immediate visual continuity anchor
  | 'supporting_frame' // Level 3: Secondary temporal anchor
  | 'style' // Level 4: Cinematography & color grading LUT
  | 'costume'
  | 'mood'
  | 'prop';

export interface ReferenceImage {
  id: string;
  url: string;
  type: 'identity' | 'costume' | 'mood' | 'architecture' | 'prop' | 'style';
  role?: ReferenceRole;
  level?: ReferenceHierarchyLevel;
  label?: string;
  notes?: string;
}

// 12 Granular Invariant Locks
export interface GranularLocks {
  identity: boolean; // LOCK IDENTITY: Bone structure, ethnicity, age, facial landmarks
  face: boolean; // LOCK FACE: Micro-expressions / facial geometry
  hair: boolean; // LOCK HAIR: Cut, texture, parting, volume
  wardrobe: boolean; // LOCK WARDROBE: Garment weave, fabric, buttons, color
  location: boolean; // LOCK LOCATION: Physical room/environment
  architecture: boolean; // LOCK ARCHITECTURE: Walls, windows, doors, structural layout
  prop: boolean; // LOCK PROP: Recurring item condition, wear, placement
  lighting: boolean; // LOCK LIGHTING: Direction, contrast ratio, color temperature
  time: boolean; // LOCK TIME: Time of day continuity
  weather: boolean; // LOCK WEATHER: Atmospheric condition
  composition: boolean; // LOCK COMPOSITION: Camera framing, eye-lines, rule of thirds
  visualStyle: boolean; // LOCK VISUAL STYLE: 35mm grain, color science, LUT
}

// Character Identity (Immutable baseline) vs Character State (Dynamic temporal evolution)
export interface CharacterIdentity {
  id: string;
  name: string;
  age: number | string;
  gender: string;
  ethnicity: string;
  skinTone: string;
  faceShape: string;
  eyeColor: string;
  hair: string;
  hairStyle: string;
  bodyType: string;
  height: string;
  distinctiveFeatures: string;
}

export interface CharacterState {
  characterId: string;
  characterName: string;
  hairCondition: string; // e.g. "dry neat braids", "wet and disheveled from rain", "pinned up loosely"
  wardrobeDescription: string; // e.g. "beige knit cardigan over faded indigo blouse"
  wardrobeCondition: string; // e.g. "pristine", "rain-soaked collar", "creased sleeve with slight soil"
  accessories: string; // e.g. "silver whistle locket clutched in hand"
  emotionalExpression: string; // e.g. "grief restrained by fierce determination"
  physicalCondition: string; // e.g. "exhausted, red tear-streaked eyes", "bandaged knuckles", "nominal"
  lastKnownSpatialPosition: string; // e.g. "sitting on edge of caramel leather armchair facing door"
}

export interface Character {
  id: string;
  name: string;
  age: number | string;
  gender: string;
  ethnicity: string;
  skinTone: string;
  faceShape: string;
  eyeColor: string;
  hair: string;
  hairStyle: string;
  bodyType: string;
  height: string;
  clothing: string;
  accessories: string;
  personality: string;
  emotionalCharacteristics: string;
  description?: string; // Optional user description
  notes?: string; // Optional character notes
  creationMode?: 'reference' | 'generated' | 'hybrid'; // Reference mode, generated, or hybrid
  referenceImages: ReferenceImage[];
  wardrobeReferences?: ReferenceImage[];
  avatarUrl?: string; // Convenience avatar display
  isLocked: boolean; // Master character lock (identity lock)
  currentState?: CharacterState; // Active temporal state in story
}

export interface Location {
  id: string;
  name: string;
  description: string;
  architecture: string;
  isInterior: boolean;
  furniture: string;
  walls: string;
  windows: string;
  doors: string;
  props: string;
  colorPalette: string;
  lighting: string;
  referenceImages: ReferenceImage[];
  isLocked: boolean;
  architectureLocked?: boolean;
  layoutLocked?: boolean;
  environmentLocked?: boolean;
}

export interface Prop {
  id: string;
  name: string;
  category: string;
  description: string;
  material: string;
  recurringState: string;
  currentRoomPosition?: string;
  referenceImages: ReferenceImage[];
  isLocked: boolean;
}

// Spatial Continuity Engine
export interface SpatialPlacement {
  characterId: string;
  characterName: string;
  positionDescription: string; // e.g. "seated on left cushion of sofa"
  facingDirection: string; // e.g. "facing toward front entrance"
  anchorFurniture?: string; // e.g. "sofa", "coffee table"
  distanceToCamera?: string; // e.g. "2 meters"
}

export interface SpatialState {
  characterPlacements: SpatialPlacement[];
  cameraPlacementDescription: string; // e.g. "Camera positioned 2.5m away at eye-level, 30° off-axis"
  doorRelationships: string; // e.g. "Front mahogany door is 3.5m to Maya's right"
  windowRelationships: string; // e.g. "Large street window directly behind sofa camera-left"
  furniturePositions: string; // e.g. "Teak coffee table centered 1 meter ahead of sofa"
  characterPositions?: string; // Narrative summary of subject positions
  environmentalAnchors?: string; // Narrative summary of key anchors
  cameraDistanceMeters?: number;
}

// Story State (Progression between scenes)
export interface StoryState {
  previousEvent: string; // What happened immediately before
  currentEvent: string; // What occurs in this scene
  nextEvent: string; // What the subsequent scene requires
  narrativeMoment?: string; // Summary beat tag
}

// Scene State Snapshot (Approved immutable state record)
export interface SceneStateSnapshot {
  id: string;
  sceneId: string; // e.g. "EP1-001"
  sceneNumber?: string; // Convenience alias
  episode: string;
  timestamp: number;
  approvedAt?: number; // Convenience alias
  approvedFrameId?: string;
  characterStates: CharacterState[];
  characters?: CharacterState[]; // Convenience alias
  locationState: {
    locationId: string;
    locationName: string;
    roomSetup: string;
    doorsWindowsSummary: string;
    interior?: boolean;
  };
  location?: {
    locationId: string;
    locationName: string;
    roomSetup: string;
    doorsWindowsSummary: string;
    interior?: boolean;
  }; // Convenience alias
  propStates: {
    propId: string;
    propName: string;
    state: string;
    position: string;
  }[];
  props?: {
    propId: string;
    propName: string;
    state: string;
    position: string;
  }[]; // Convenience alias
  lightingState: LightingSettings;
  lighting?: LightingSettings; // Convenience alias
  time: string;
  weather: string;
  spatialState: SpatialState;
  storyState: StoryState;
  cinematography: CinematographySettings;
  locks: GranularLocks;
}

// Pre-Generation Continuity Check & Conflict Diagnostics
export interface PreGenCheckItem {
  id: string;
  category: 'identity' | 'wardrobe' | 'location' | 'props' | 'lighting' | 'time' | 'weather' | 'spatial' | 'visualStyle';
  label: string;
  status: 'passed' | 'conflict' | 'info';
  previousEstablished: string;
  currentRequested: string;
  explanation: string;
  resolutionOptions?: ('keep_previous' | 'apply_new' | 'edit_scene')[];
}

export interface PreGenContinuityAnalysis {
  hasConflicts: boolean;
  checks: PreGenCheckItem[];
  conflictSummary?: string;
}

// Post-Generation Continuity Diagnostics (Separate measurements, NOT generic quality scores)
export interface ContinuityDiagnosticReport {
  identityScore: number; // e.g. 98%
  wardrobeScore: number; // e.g. 100%
  locationScore: number; // e.g. 94%
  propScore: number; // e.g. 100%
  lightingScore: number; // e.g. 96%
  spatialScore: number; // e.g. 95%
  cameraScore: number; // e.g. 100%
  diagnostics: {
    category: string;
    passed: boolean;
    metric: string;
    detail: string;
  }[];
}

// Change-Only Instruction
export interface ChangeOnlyRequest {
  active: boolean;
  targetElement: 'wardrobe' | 'camera' | 'lighting' | 'expression' | 'props' | 'background';
  changeDescription: string;
  preservedElements: string[];
}

// Scene Bridge / Transition Scene Suggestion
export interface TransitionBridgeSuggestion {
  isBridgeNeeded: boolean;
  needed?: boolean; // Convenience alias
  reason: string;
  fromSceneId: string;
  toSceneId: string;
  suggestedAction: string;
  proposedAction?: string; // Convenience alias
  suggestedShotType: ShotType;
  suggestedShot?: string; // Convenience alias
  suggestedDuration: string;
}

export interface Scene {
  id: string;
  sceneId: string; // e.g. "EP1-001"
  episode: string; // e.g. "EP1"
  title: string;
  description: string;
  characterIds: string[];
  locationId: string;
  propIds: string[];
  time: string;
  weather: string;
  emotion: string;
  cinematography: CinematographySettings;
  lighting: LightingSettings;
  spatialState: SpatialState;
  storyState: StoryState;
  characterStates: CharacterState[];
  locks: GranularLocks;
  masterFrameId?: string;
  isApproved: boolean; // Human Approval Gate
  status?: 'draft' | 'approved' | 'in_review'; // Workflow status
  approvedSnapshot?: SceneStateSnapshot;
  primaryContinuityRefId?: string; // Reference to approved master frame in chain
  supportingContinuityRefIds?: string[];
  changeOnlyRequest?: ChangeOnlyRequest;
  customPrompt?: string;
  notes?: string;
  createdAt: number;
}

export interface MasterFrameLocks {
  character: boolean;
  location: boolean;
  wardrobe: boolean;
  lighting: boolean;
  props: boolean;
  composition: boolean;
}

export interface GeneratedFrame {
  id: string;
  sceneId: string;
  projectId: string;
  episode: string;
  url: string;
  prompt: string;
  negativePrompt: string;
  explanation?: string;
  cinematography: CinematographySettings;
  lighting: LightingSettings;
  characterIds: string[];
  locationId: string;
  propIds: string[];
  aspectRatio: AspectRatio;
  provider: string;
  timestamp: number;
  isMasterFrame: boolean;
  isApproved: boolean; // Approved by user
  approvedTimestamp?: number;
  locks: GranularLocks;
  continuityStatus: 'passed' | 'warnings' | 'unverified';
  continuityWarnings: string[];
  continuityReport?: ContinuityDiagnosticReport;
}

export interface ContinuityWarning {
  id: string;
  type: 'wardrobe' | 'location' | 'lighting' | 'prop' | 'time' | 'weather' | 'character' | 'spatial';
  severity: 'warning' | 'info' | 'critical';
  message: string;
  recommendation: string;
  compareSceneId?: string;
  characterId?: string;
}

export interface Episode {
  id: string;
  episodeNumber: string; // e.g. "EP1", "EP2"
  title: string;
  startingFromEpisode?: string; // e.g. "EP1-005"
  initialSnapshotId?: string;
  sceneCount: number;
}

export interface MovieWideCharacterMemory {
  characterId: string;
  characterName: string;
  currentWardrobe: string;
  currentHair: string;
  currentEmotionalState: string;
  lastKnownEmotionalState?: string; // Convenience alias
  canonicalBiometrics?: string; // Facial signature
  appearanceHistory?: string[]; // Scenes appeared in
  physicalCondition: string;
  lastKnownLocationId: string;
  lastKnownLocationName: string;
  lastKnownSpatialPosition: string;
  importantPropIds: string[];
  recentSceneIds: string[];
}

export interface SceneCommandParseResult {
  sceneId: string;
  cleanPrompt: string;
  matchedCharacterIds: string[];
  matchedLocationId?: string;
  matchedPropIds: string[];
  detectedShotType?: ShotType;
  detectedLens?: LensFocalLength;
  detectedTime?: string;
  detectedLighting?: string;
  selectedReferenceImages: ReferenceImage[];
}

export interface Project {
  id: string;
  title: string;
  genre: string;
  visualStyle: string;
  aspectRatio: AspectRatio;
  cinematicReference: string;
  colorPalette: string;
  cameraLanguage: string;
  lightingLanguage: string;
  visualDNA: VisualDNA;
  masterCinematicPrompt?: string; // Master Cinematic Prompt defining Project Visual DNA
  logline?: string;
  projectType?: string; // e.g. "Feature Film", "Episodic Series", "Short Film", "AI Film"
  productionStage: 'bible' | 'production'; // Stage 1: Build Visual Bible | Stage 2: Scene Production
  visualBibleLocked: boolean; // Locked when ready for scene generation
  currentEpisode: string; // e.g. "EP1"
  episodes: Episode[];
  characters: Character[];
  locations: Location[];
  props: Prop[];
  scenes: Scene[];
  generatedFrames: GeneratedFrame[];
  stateSnapshots: SceneStateSnapshot[]; // Master Frame Chain
  characterMemories: Record<string, MovieWideCharacterMemory>; // Movie-Wide Character Memory
  createdAt: number;
}
