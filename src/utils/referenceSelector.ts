import {
  Project,
  Character,
  Location,
  Prop,
  ReferenceImage,
  SceneCommandParseResult,
  ShotType,
  LensFocalLength,
} from '../types/cinema';

/**
 * Parses user input command, e.g.:
 * "EP1-001 image Anna sits alone at the kitchen table reading an old letter. Early morning light enters through the window. Medium close-up, 50mm lens, restrained sadness."
 * or:
 * "SCENE-002 Maya stands by the window while Ethan sleeps."
 * or standard text prompt without prefix.
 */
export function parseSceneCommand(
  rawInput: string,
  project: Project,
  defaultSceneId: string = 'EP1-001'
): SceneCommandParseResult {
  const trimmed = rawInput.trim();

  // Regex pattern for scene identifier prefixes:
  // e.g., "EP1-001 image", "EP1-001", "SCENE-01", "SHOT-003 image", etc.
  const prefixRegex = /^([A-Za-z0-9_-]+)(?:\s+image|\s+scene|\s*:)?\s*[\n\r-]?\s*(.*)$/is;
  const match = trimmed.match(prefixRegex);

  let sceneId = defaultSceneId;
  let cleanPrompt = trimmed;

  if (match) {
    const candidateId = match[1].trim();
    // Validate if candidate looks like a scene ID (contains digits or standard labels)
    if (
      candidateId.toUpperCase().startsWith('EP') ||
      candidateId.toUpperCase().startsWith('SCENE') ||
      candidateId.toUpperCase().startsWith('SHOT') ||
      candidateId.toUpperCase().startsWith('SC') ||
      candidateId.toUpperCase().startsWith('ACT') ||
      /\d/.test(candidateId)
    ) {
      sceneId = candidateId.toUpperCase();
      cleanPrompt = match[2].trim() || trimmed;
    }
  }

  // If cleanPrompt still starts with "[USER'S COMPLETE SCENE IMAGE PROMPT]" or brackets, clean lightly
  cleanPrompt = cleanPrompt.replace(/^\[(.*)\]$/s, '$1').trim();

  // 1. Intelligent Character Selection
  // Find which characters from the project are explicitly mentioned in cleanPrompt
  const matchedCharacters: Character[] = [];
  const lowerPrompt = cleanPrompt.toLowerCase();

  for (const char of project.characters) {
    const nameLower = char.name.toLowerCase().trim();
    // Use word boundary check so "Dan" doesn't falsely match "Daniel" or "Danielle"
    const regex = new RegExp(`\\b${escapeRegExp(nameLower)}\\b`, 'i');
    if (regex.test(cleanPrompt)) {
      matchedCharacters.push(char);
    }
  }

  // Fallback: If no character is explicitly mentioned by name, check if prompt has generic terms like
  // "the woman", "he", "she", or if only 1 character exists in project, do not blindly dump all cast!
  // If no match, do NOT over-infer multiple characters.
  const matchedCharacterIds = matchedCharacters.map((c) => c.id);

  // 2. Intelligent Location Selection
  let matchedLocation: Location | undefined;
  for (const loc of project.locations) {
    const locNameLower = loc.name.toLowerCase().trim();
    const regex = new RegExp(`\\b${escapeRegExp(locNameLower)}\\b`, 'i');
    if (regex.test(cleanPrompt)) {
      matchedLocation = loc;
      break;
    }

    // Also check keywords in location description or room terms
    const roomKeywords = extractKeyNouns(loc.name);
    for (const kw of roomKeywords) {
      if (kw.length >= 4 && new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'i').test(cleanPrompt)) {
        matchedLocation = loc;
        break;
      }
    }
    if (matchedLocation) break;
  }

  // 3. Intelligent Prop Selection
  const matchedProps: Prop[] = [];
  for (const prop of project.props) {
    const propNameLower = prop.name.toLowerCase().trim();
    const regex = new RegExp(`\\b${escapeRegExp(propNameLower)}\\b`, 'i');
    if (regex.test(cleanPrompt)) {
      matchedProps.push(prop);
    }
  }
  const matchedPropIds = matchedProps.map((p) => p.id);

  // 4. Extract explicit cinematography / lens if stated in scene prompt
  const detectedShotType = detectShotType(cleanPrompt);
  const detectedLens = detectLens(cleanPrompt);
  const detectedTime = detectTimeOfDay(cleanPrompt);
  const detectedLighting = detectLighting(cleanPrompt);

  // 5. Reference Selection Engine
  // Collect ONLY relevant reference images for matched entities
  const selectedReferenceImages: ReferenceImage[] = [];

  // Level 1: Character identity references for matched cast ONLY
  for (const char of matchedCharacters) {
    if (char.referenceImages && char.referenceImages.length > 0) {
      // Pick identity references
      const idRefs = char.referenceImages.filter((r) => r.type === 'identity' || r.role === 'identity');
      if (idRefs.length > 0) {
        selectedReferenceImages.push(...idRefs.slice(0, 2));
      } else {
        selectedReferenceImages.push(char.referenceImages[0]);
      }
    }
  }

  // Level 2: Location reference for matched location ONLY
  if (matchedLocation && matchedLocation.referenceImages && matchedLocation.referenceImages.length > 0) {
    selectedReferenceImages.push(matchedLocation.referenceImages[0]);
  }

  // Level 3: Prop references for matched props ONLY
  for (const prop of matchedProps) {
    if (prop.referenceImages && prop.referenceImages.length > 0) {
      selectedReferenceImages.push(prop.referenceImages[0]);
    }
  }

  return {
    sceneId,
    cleanPrompt,
    matchedCharacterIds,
    matchedLocationId: matchedLocation?.id,
    matchedPropIds,
    detectedShotType,
    detectedLens,
    detectedTime,
    detectedLighting,
    selectedReferenceImages,
  };
}

/**
 * Combines Project Visual DNA + References + User Scene Prompt
 * WITHOUT rewriting or mutating the filmmaker's scene prompt.
 * Preserves the exact user instructions with highest scene-specific authority.
 */
export function buildUniversalScenePrompt(
  parseResult: SceneCommandParseResult,
  project: Project,
  previousApprovedFrameUrl?: string
): {
  composedPositivePrompt: string;
  composedNegativePrompt: string;
  selectedReferences: ReferenceImage[];
  detectedSummary: {
    characters: string[];
    location?: string;
    props: string[];
    inheritedStyle: string;
  };
} {
  const characters = project.characters.filter((c) => parseResult.matchedCharacterIds.includes(c.id));
  const location = project.locations.find((l) => l.id === parseResult.matchedLocationId);
  const props = project.props.filter((p) => parseResult.matchedPropIds.includes(p.id));

  // Visual DNA from Project / Master Cinematic Prompt
  const masterPrompt = project.masterCinematicPrompt || project.visualDNA?.masterPrompt || '';
  const visualStyle = project.visualStyle || 'Photorealistic 35mm cinema';
  const colorGrading = project.visualDNA?.colorLanguage || 'Naturalistic film grading';
  const texture = project.visualDNA?.texture || '35mm film texture';

  // Hierarchy Level 1: Locked Character Biometrics
  const characterIdentityDirectives = characters.map((c) => {
    const lockText = c.isLocked ? '[IDENTITY LOCKED: preserve facial proportions, bone structure, eye distance, and skin undertone]' : '';
    const desc = c.description ? ` (${c.description})` : '';
    const clothes = c.clothing ? `, wearing: ${c.clothing}` : '';
    return `${c.name}${desc}${clothes} ${lockText}`.trim();
  }).join('; ');

  // Hierarchy Level 2: Locked Location Architecture
  const locationDirective = location
    ? `${location.name}: ${location.description || ''}. Architecture: ${location.architecture || 'Continuous practical set'}${location.isLocked ? ' [ARCHITECTURE LOCKED: preserve room dimensions, wall texture, and door/window positions]' : ''}`
    : '';

  // Hierarchy Level 3: Locked Recurring Props
  const propDirective = props.length > 0
    ? props.map((p) => `${p.name} (${p.description || p.recurringState || 'locked appearance'})${p.isLocked ? ' [PROP LOCKED]' : ''}`).join(', ')
    : '';

  // Construct Final Prompt
  // Highest Scene-Specific Authority: The user's exact scene prompt is placed front and center.
  // We do NOT invent extra items (coffee cups, handbags, random hairstyles).
  const promptSections: string[] = [];

  // 1. User's Direct Scene Action & Narrative Focus (HIGHEST SCENE-SPECIFIC AUTHORITY)
  promptSections.push(`[SCENE ACTION & COMPOSITION] ${parseResult.cleanPrompt}`);

  // 2. Verified Character Identities
  if (characterIdentityDirectives) {
    promptSections.push(`[SUBJECT IDENTITIES] ${characterIdentityDirectives}`);
  }

  // 3. Verified Set / Location Architecture
  if (locationDirective) {
    promptSections.push(`[ENVIRONMENT & SET] ${locationDirective}`);
  }

  // 4. Verified Recurring Props
  if (propDirective) {
    promptSections.push(`[HERO PROPS] ${propDirective}`);
  }

  // 5. Project Visual DNA & Master Cinematic Prompt
  if (masterPrompt) {
    promptSections.push(`[PROJECT VISUAL DNA] ${masterPrompt}`);
  } else {
    promptSections.push(`[PROJECT VISUAL DNA] ${visualStyle}. ${colorGrading}, ${texture}, natural optical physics, Kodak Vision3 500T color science.`);
  }

  // 6. Camera & Optics (if detected or default project)
  const cameraNotes: string[] = [];
  if (parseResult.detectedShotType) cameraNotes.push(`Shot: ${parseResult.detectedShotType}`);
  if (parseResult.detectedLens) cameraNotes.push(`Lens: ${parseResult.detectedLens}`);
  if (parseResult.detectedLighting) cameraNotes.push(`Lighting: ${parseResult.detectedLighting}`);
  if (parseResult.detectedTime) cameraNotes.push(`Time: ${parseResult.detectedTime}`);

  if (cameraNotes.length > 0) {
    promptSections.push(`[OPTICAL PARAMETERS] ${cameraNotes.join(' · ')}`);
  }

  const composedPositivePrompt = promptSections.join('\n\n');

  // Negative constraints: Strict anti-distortion, anti-hallucination
  const composedNegativePrompt = [
    'distorted anatomy',
    'extra limbs',
    'mutated hands',
    'malformed eyes',
    'plastic skin',
    'airbrushed 3D render',
    'cgi video game look',
    'oversaturated neon HDR',
    'invented unprompted accessories',
    'unprompted extra people',
    'random clothing morphing',
    'inconsistent facial structure',
    'watermark',
    'text overlay',
    'logos',
    'subtitles',
    ...(project.visualDNA?.negativeConstraints || []),
  ].join(', ');

  return {
    composedPositivePrompt,
    composedNegativePrompt,
    selectedReferences: parseResult.selectedReferenceImages,
    detectedSummary: {
      characters: characters.map((c) => c.name),
      location: location?.name,
      props: props.map((p) => p.name),
      inheritedStyle: masterPrompt ? 'Master Cinematic Prompt (Locked)' : visualStyle,
    },
  };
}

// Helper: Escape string for RegExp
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper: Extract key words from location name
function extractKeyNouns(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[\s,'"-]+/)
    .filter((w) => !['the', 'and', 'or', 'in', 'at', 'on', 'of', 'house', 'room'].includes(w));
}

function detectShotType(prompt: string): ShotType | undefined {
  const p = prompt.toLowerCase();
  if (p.includes('extreme close-up') || p.includes('ecu')) return 'Extreme Close-Up';
  if (p.includes('medium close-up') || p.includes('mcu')) return 'Medium Close-Up';
  if (p.includes('close-up') || p.includes('close up')) return 'Close-Up';
  if (p.includes('extreme wide') || p.includes('ews')) return 'Extreme Wide Shot';
  if (p.includes('medium wide') || p.includes('mws')) return 'Medium Wide';
  if (p.includes('wide shot') || p.includes('wide angle')) return 'Wide Shot';
  if (p.includes('full shot') || p.includes('full body')) return 'Full Shot';
  if (p.includes('two shot')) return 'Two Shot';
  if (p.includes('over-the-shoulder') || p.includes('ots')) return 'Over-the-Shoulder';
  if (p.includes('point of view') || p.includes('pov')) return 'POV';
  if (p.includes('medium shot')) return 'Medium Shot';
  return undefined;
}

function detectLens(prompt: string): LensFocalLength | undefined {
  const p = prompt.toLowerCase();
  if (/\b18mm\b/.test(p)) return '18mm';
  if (/\b24mm\b/.test(p)) return '24mm';
  if (/\b28mm\b/.test(p)) return '28mm';
  if (/\b35mm\b/.test(p)) return '35mm';
  if (/\b50mm\b/.test(p)) return '50mm';
  if (/\b85mm\b/.test(p)) return '85mm';
  if (/\b135mm\b/.test(p)) return '135mm';
  return undefined;
}

function detectTimeOfDay(prompt: string): string | undefined {
  const p = prompt.toLowerCase();
  if (p.includes('dawn') || p.includes('first light')) return 'Dawn';
  if (p.includes('early morning')) return 'Early Morning';
  if (p.includes('morning')) return 'Morning';
  if (p.includes('noon') || p.includes('midday')) return 'Midday';
  if (p.includes('golden hour')) return 'Golden Hour';
  if (p.includes('late afternoon') || p.includes('dusk')) return 'Late Afternoon';
  if (p.includes('sunset') || p.includes('twilight')) return 'Sunset';
  if (p.includes('night') || p.includes('midnight')) return 'Night';
  return undefined;
}

function detectLighting(prompt: string): string | undefined {
  const p = prompt.toLowerCase();
  if (p.includes('soft window light') || p.includes('window light')) return 'Soft window light';
  if (p.includes('dramatic') || p.includes('low-key') || p.includes('chiaroscuro')) return 'Low-key dramatic lighting';
  if (p.includes('candlelight') || p.includes('candle')) return 'Warm candlelight';
  if (p.includes('sunlight') || p.includes('direct sun')) return 'Direct natural sunlight';
  if (p.includes('neon') || p.includes('practical lamps')) return 'Practical neon and interior lamps';
  if (p.includes('overcast') || p.includes('diffuse')) return 'Overcast soft diffusion';
  return undefined;
}
