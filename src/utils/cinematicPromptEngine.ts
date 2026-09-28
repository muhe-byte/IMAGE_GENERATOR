import {
  Scene,
  Character,
  Location,
  Prop,
  VisualDNA,
  CinematographySettings,
  LightingSettings,
  SceneStateSnapshot,
  ChangeOnlyRequest,
} from '../types/cinema';

export interface PromptGenerationResult {
  fullPrompt: string;
  negativePrompt: string;
  explanation: string;
  referenceHierarchySummary: string;
  breakdown: {
    characterIdentity: string;
    characterState: string;
    wardrobe: string;
    locationArchitecture: string;
    spatialPlacement: string;
    storyContext: string;
    action: string;
    emotion: string;
    cinematography: string;
    lighting: string;
    color: string;
    composition: string;
    continuityInvariants: string;
    realism: string;
  };
}

export function generateCinematicPrompt(
  scene: Scene,
  characters: Character[],
  location?: Location,
  props: Prop[] = [],
  visualDNA?: VisualDNA,
  previousSnapshot?: SceneStateSnapshot | null
): PromptGenerationResult {
  const isChangeOnly = scene.changeOnlyRequest?.active;
  const changeReq = scene.changeOnlyRequest;

  // 1. Level 1: Character Identity & Biometrics (HIGHEST PRIORITY)
  const charIdentityParts: string[] = [];
  const charStateParts: string[] = [];
  const wardrobeParts: string[] = [];
  const continuityLocks: string[] = [];

  characters.forEach((char) => {
    // Identity (Immutable bone structure, ethnicity, age, eye color)
    let idInfo = `${char.name}: ${char.age}-year-old ${char.ethnicity} ${char.gender}, skin tone: ${char.skinTone}, face shape: ${char.faceShape}, eye color: ${char.eyeColor}, baseline hair: ${char.hairStyle} (${char.hair}).`;
    if (scene.locks.identity || char.isLocked) {
      idInfo += ' [PRIORITY LEVEL 1: LOCKED BIOMETRIC IDENTITY - Preserve identical facial landmarks, bone structure, eye profile, and skin undertone]';
      continuityLocks.push(`LOCKED BIOMETRIC IDENTITY of ${char.name}`);
    }
    charIdentityParts.push(idInfo);

    // Temporal State (Hair condition, physical exhaustion, emotional micro-expression)
    const charState = scene.characterStates.find((cs) => cs.characterId === char.id);
    let stateInfo = `${char.name} temporal state: hair condition is ${charState?.hairCondition || 'dry and neat'}`;
    if (charState?.physicalCondition) stateInfo += `, physical state: ${charState.physicalCondition}`;
    charStateParts.push(stateInfo);

    // Wardrobe & Accessories
    let wardInfo = '';
    if (isChangeOnly && changeReq?.targetElement === 'wardrobe') {
      wardInfo = `${char.name} [CHANGE REQUESTED]: ${changeReq.changeDescription}. Retain identical facial identity, hair, lighting, and environment.`;
    } else {
      const wardDesc = charState?.wardrobeDescription || char.clothing;
      const wardCond = charState?.wardrobeCondition || 'pristine weave';
      wardInfo = `${char.name} wearing ${wardDesc} (${wardCond})`;
      if (charState?.accessories || char.accessories) {
        wardInfo += `, accessories: ${charState?.accessories || char.accessories}`;
      }
    }
    wardrobeParts.push(wardInfo);
  });

  const charIdentityBlock = charIdentityParts.length > 0 ? charIdentityParts.join('\n') : 'Authentic human subject';
  const charStateBlock = charStateParts.join('. ');
  const wardrobeBlock = wardrobeParts.length > 0 ? wardrobeParts.join('. ') : 'Natural cinematic wardrobe';

  // 2. Level 2: Location & Architecture (Walls, Windows, Doors, Spatial layout)
  let locationBlock = 'Atmospheric cinematic environment';
  if (location) {
    locationBlock = `${location.name}. ${location.description}. Architecture: ${location.architecture}. Walls: ${location.walls}, Windows: ${location.windows}, Doors: ${location.doors}.`;
    if (scene.locks.architecture || location.isLocked) {
      locationBlock += ' [PRIORITY LEVEL 2: LOCKED ARCHITECTURAL GEOMETRY - Exact window positions, room layout, and door relationships strictly preserved]';
      continuityLocks.push(`LOCKED ARCHITECTURE of ${location.name}`);
    }
  }

  // 3. Spatial State Continuity
  let spatialBlock = '';
  if (scene.spatialState?.characterPlacements?.length > 0) {
    const placements = scene.spatialState.characterPlacements
      .map((p) => `${p.characterName} is positioned ${p.positionDescription}, facing ${p.facingDirection}`)
      .join('; ');
    spatialBlock = `Spatial layout: ${placements}. ${scene.spatialState.cameraPlacementDescription || ''}. ${scene.spatialState.doorRelationships || ''} ${scene.spatialState.windowRelationships || ''}`.trim();
  } else {
    spatialBlock = 'Characters positioned with naturalistic spatial balance and physically motivated eye-lines.';
  }

  // 4. Story Context & Action
  const storyBlock = scene.storyState?.previousEvent
    ? `Story arc context: Immediately following "${scene.storyState.previousEvent}". Now occurring: "${scene.description}". Leading into: "${scene.storyState.nextEvent || 'subsequent narrative beat'}".`
    : `Narrative action: ${scene.description}`;

  // 5. Props (Hero Objects)
  const propBlock = props.length > 0
    ? `Hero props present: ${props.map((p) => `${p.name} (${p.description}, recurring condition: ${p.recurringState})`).join(', ')}.`
    : '';

  // 6. Cinematography
  const { shotType, cameraAngle, cameraMovement, lens, depthOfField, focusTarget } = scene.cinematography;
  let cinemaBlock = '';
  if (isChangeOnly && changeReq?.targetElement === 'camera') {
    cinemaBlock = `[CHANGE REQUESTED]: ${changeReq.changeDescription}. Framing: ${shotType} from ${cameraAngle} with ${lens} lens. Maintain identical character pose, wardrobe, location, and lighting.`;
  } else {
    cinemaBlock = `Cinematography: ${shotType} captured from ${cameraAngle}. Cinema prime focal length: ${lens}. Depth of Field: ${depthOfField}. Focus target critically locked on ${focusTarget}. Composition dynamic: ${cameraMovement}.`;
  }

  // 7. Lighting
  const { preset, keyLightDirection, fillIntensity, backlight, contrastRatio, shadowDensity, colorTemperature } = scene.lighting;
  const lightingBlock = `Lighting design: ${preset}. Motivated key light entering from ${keyLightDirection}. Contrast ratio: ${contrastRatio}. Color temperature: ${colorTemperature}. Fill light at ${fillIntensity}%, backlight kicker at ${backlight}%. Shadows: ${shadowDensity}, physically accurate optical light falloff following inverse-square law.`;

  // 8. Visual DNA & Color Science
  const filmLook = visualDNA?.filmLook || 'Contemporary drama';
  const colorLang = visualDNA?.colorLanguage || 'Muted';
  const texture = visualDNA?.texture || 'Subtle film grain';
  const colorBlock = `Color grading: ${colorLang} palette tailored for ${filmLook}. Film texture: ${texture}, 35mm optical grain, natural halation around highlights, rich shadow detail without digital crushing.`;

  // 9. Negative Constraints
  const baseNegatives = [
    'distorted anatomy',
    'duplicated people',
    'extra fingers',
    'malformed hands',
    'unnatural eyes',
    'plastic skin',
    'excessive HDR',
    'overexposure',
    'oversaturated neon colors',
    'artificial beauty retouching',
    'random jewelry changes',
    'random wardrobe swaps',
    'inconsistent facial bone structure',
    'inconsistent architectural layout',
    'text artifacts',
    'watermarks',
    'logos',
    'amateur smartphone snapshot quality',
    'CGI render smoothness',
    'doll face',
    'anime / cartoon stylization',
  ];

  const negativePrompt = [...baseNegatives, ...(visualDNA?.negativeConstraints || [])].join(', ');

  // 10. Master Frame Chain Reference Notes
  let referenceHierarchySummary = 'Level 1: Character Biometrics > Level 2: Location Architecture > Level 3: Master Frame Chain > Level 4: Style LUT';
  if (scene.primaryContinuityRefId) {
    referenceHierarchySummary += ` | Anchored to Master Frame: ${scene.primaryContinuityRefId}`;
  }

  // Assemble Complete Prompt with Hierarchy Headers
  const promptSections = [
    `=== CINEFRAME AI TEMPORAL CONTINUITY PROMPT ===`,
    `[PRIORITY LEVEL 1 - IDENTITY] ${charIdentityBlock}`,
    `[CHARACTER TEMPORAL STATE] ${charStateBlock}`,
    `[WARDROBE & ACCESSIBLE PROPS] ${wardrobeBlock}`,
    `[PRIORITY LEVEL 2 - LOCATION & ARCHITECTURE] ${locationBlock} ${propBlock}`.trim(),
    `[SPATIAL RELATIONSHIPS] ${spatialBlock}`,
    `[STORY ARC & ACTION] ${storyBlock}`,
    `[EMOTION & SUBTEXT] ${scene.emotion}`,
    `[CINEMATOGRAPHY & FRAMING] ${cinemaBlock}`,
    `[LIGHTING & INVERSE-SQUARE PHYSICS] ${lightingBlock}`,
    `[PRIORITY LEVEL 4 - COLOR SCIENCE & GRAIN] ${colorBlock}`,
    `[CONTINUITY LOCKS] ${continuityLocks.join('; ') || 'Continuous temporal sequence'}`,
    `[OPTICAL SENSOR] Captured on ARRI Alexa LF large format sensor with Cooke / ARRI Master Primes. Photorealistic human verisimilitude, believable pores, genuine eye catchlights, no plastic sheen.`,
  ];

  const fullPrompt = promptSections.join('\n\n');

  // Directorial Rationale
  const explanation = `${lens} prime at ${cameraAngle} preserves authentic human eye scale for this ${shotType}. ${preset} motivated from ${keyLightDirection} ensures strict lighting continuity with ${previousSnapshot?.sceneId || 'preceding approved takes'}.`;

  return {
    fullPrompt,
    negativePrompt,
    explanation,
    referenceHierarchySummary,
    breakdown: {
      characterIdentity: charIdentityBlock,
      characterState: charStateBlock,
      wardrobe: wardrobeBlock,
      locationArchitecture: locationBlock,
      spatialPlacement: spatialBlock,
      storyContext: storyBlock,
      action: scene.description,
      emotion: scene.emotion,
      cinematography: cinemaBlock,
      lighting: lightingBlock,
      color: colorBlock,
      composition: `Shot: ${shotType}, Angle: ${cameraAngle}, Lens: ${lens}`,
      continuityInvariants: continuityLocks.join('; '),
      realism: 'ARRI Alexa LF 35mm Master Prime photorealism',
    },
  };
}
