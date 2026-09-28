import { AspectRatio, CinematographySettings, LightingSettings, Character, Location, Prop, FilmLook } from '../types/cinema';

interface SynthesizerParams {
  aspectRatio: AspectRatio;
  cinematography: CinematographySettings;
  lighting: LightingSettings;
  filmLook?: FilmLook;
  sceneTitle: string;
  sceneId: string;
  characters?: Character[];
  location?: Location;
  props?: Prop[];
  emotion?: string;
  time?: string;
  variationSeed?: number;
}

export function synthesizeCinematicFrame(params: SynthesizerParams): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Base canvas dimensions based on aspect ratio
  let width = 1280;
  let height = 720; // 16:9 default

  if (params.aspectRatio === '2.39:1') {
    width = 1434;
    height = 600;
  } else if (params.aspectRatio === '1.85:1') {
    width = 1295;
    height = 700;
  } else if (params.aspectRatio === '4:3') {
    width = 1000;
    height = 750;
  } else if (params.aspectRatio === '1:1') {
    width = 900;
    height = 900;
  } else if (params.aspectRatio === '9:16') {
    width = 720;
    height = 1280;
  }

  canvas.width = width;
  canvas.height = height;

  const seed = (params.variationSeed || 42) + params.sceneId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  // Determine color temperature & lighting palette
  const isTungsten = params.lighting.preset.includes('Tungsten') || params.lighting.preset.includes('Candlelight') || (params.lighting.colorTemperature && params.lighting.colorTemperature.includes('3200K'));
  const isBlueHour = params.lighting.preset.includes('Blue hour') || (params.time && (params.time.toLowerCase().includes('night') || params.time.toLowerCase().includes('blue')));
  const isGoldenHour = params.lighting.preset.includes('Golden hour') || (params.time && params.time.toLowerCase().includes('golden'));
  const isLowKey = params.lighting.preset.includes('Low-key') || params.lighting.contrastRatio === 'High 8:1' || params.lighting.contrastRatio === 'Extreme 16:1';

  // 1. Background Environment Gradient (Photorealistic atmospheric depth)
  let bgGrad = ctx.createLinearGradient(0, 0, width, height);
  if (isBlueHour) {
    bgGrad.addColorStop(0, '#0a1017');
    bgGrad.addColorStop(0.5, '#0e1823');
    bgGrad.addColorStop(1, '#080c10');
  } else if (isGoldenHour) {
    bgGrad.addColorStop(0, '#2d180d');
    bgGrad.addColorStop(0.5, '#45220c');
    bgGrad.addColorStop(1, '#1b0f08');
  } else if (isTungsten) {
    bgGrad.addColorStop(0, '#1c140d');
    bgGrad.addColorStop(0.6, '#281c12');
    bgGrad.addColorStop(1, '#120c08');
  } else {
    // Natural daylight / contemporary drama muted palette
    bgGrad.addColorStop(0, '#17191d');
    bgGrad.addColorStop(0.5, '#1e2229');
    bgGrad.addColorStop(1, '#111317');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Interior / Architecture Motivated Layer
  const isInterior = params.location ? params.location.isInterior : true;
  if (isInterior) {
    // Window or practical wall structure
    const windowX = params.lighting.keyLightDirection.includes('Left') ? width * 0.15 : width * 0.85;
    const windowGrad = ctx.createRadialGradient(windowX, height * 0.35, 10, windowX, height * 0.35, width * 0.7);
    
    if (isGoldenHour) {
      windowGrad.addColorStop(0, 'rgba(255, 180, 110, 0.35)');
      windowGrad.addColorStop(0.4, 'rgba(210, 120, 50, 0.12)');
      windowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else if (isBlueHour) {
      windowGrad.addColorStop(0, 'rgba(120, 170, 240, 0.3)');
      windowGrad.addColorStop(0.4, 'rgba(60, 100, 170, 0.1)');
      windowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      windowGrad.addColorStop(0, 'rgba(240, 245, 250, 0.28)');
      windowGrad.addColorStop(0.4, 'rgba(180, 195, 210, 0.08)');
      windowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = windowGrad;
    ctx.fillRect(0, 0, width, height);

    // Architectural mullion / window silhouette
    ctx.strokeStyle = 'rgba(15, 18, 22, 0.55)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(windowX, 0);
    ctx.lineTo(windowX, height * 0.7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(windowX - width * 0.2, height * 0.35);
    ctx.lineTo(windowX + width * 0.2, height * 0.35);
    ctx.stroke();

    // Subtle wall texture / plaster tones for modest room
    ctx.fillStyle = 'rgba(70, 55, 45, 0.12)';
    ctx.fillRect(0, height * 0.55, width, height * 0.45);
  } else {
    // Exterior: Horizon & depth layering
    const horizon = height * 0.58;
    ctx.fillStyle = isBlueHour ? '#0b141d' : '#14181a';
    ctx.fillRect(0, horizon, width, height - horizon);

    // Distant soft silhouettes (trees / buildings)
    ctx.fillStyle = 'rgba(12, 17, 22, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let i = 0; i <= 10; i++) {
      const step = (width / 10) * i;
      const hOffset = Math.sin(i * 1.3 + seed) * 35;
      ctx.lineTo(step, horizon - 20 + hOffset);
    }
    ctx.lineTo(width, horizon);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Cinematic Character & Subject Composition
  const shotType = params.cinematography.shotType;
  const isCloseUp = shotType === 'Close-Up' || shotType === 'Extreme Close-Up' || shotType === 'Medium Close-Up';
  const isWide = shotType === 'Wide Shot' || shotType === 'Extreme Wide Shot' || shotType === 'Establishing Shot';
  const isTwoShot = shotType === 'Two Shot';

  // Calculate subject framing based on camera movement & movement composition
  let subjectCenterX = width * 0.46;
  if (params.cinematography.cameraMovement.includes('Push-in')) {
    subjectCenterX = width * 0.48;
  } else if (params.cinematography.cameraMovement.includes('Tracking')) {
    subjectCenterX = width * 0.52;
  } else {
    // Rule of thirds placement
    subjectCenterX = width * 0.42;
  }

  // Draw Primary Character
  const primaryChar = (params.characters && params.characters.length > 0) ? params.characters[0] : null;
  const charSkin = primaryChar?.skinTone?.toLowerCase().includes('dark') || primaryChar?.ethnicity?.toLowerCase().includes('ethiopian')
    ? { base: '#432d24', shadow: '#251711', highlight: '#735242' }
    : { base: '#705140', shadow: '#3f2c21', highlight: '#99735d' };

  if (isCloseUp) {
    // Close-Up framing: Head, shoulders, hair, emotional focus
    const headRadius = height * 0.28;
    const headCenterY = height * 0.48;

    // Body/Shoulders
    ctx.save();
    ctx.fillStyle = '#181b20';
    ctx.beginPath();
    ctx.ellipse(subjectCenterX, headCenterY + headRadius * 1.55, headRadius * 1.8, headRadius * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wardrobe collar / texture (e.g. modest knit sweater)
    ctx.fillStyle = '#26282e';
    ctx.beginPath();
    ctx.ellipse(subjectCenterX, headCenterY + headRadius * 1.2, headRadius * 0.9, headRadius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = charSkin.shadow;
    ctx.fillRect(subjectCenterX - headRadius * 0.32, headCenterY + headRadius * 0.5, headRadius * 0.64, headRadius * 0.65);

    // Head Silhouette & Shading (Chiaroscuro modeling)
    const headGrad = ctx.createRadialGradient(
      params.lighting.keyLightDirection.includes('Left') ? subjectCenterX - headRadius * 0.4 : subjectCenterX + headRadius * 0.4,
      headCenterY - headRadius * 0.2,
      headRadius * 0.2,
      subjectCenterX,
      headCenterY,
      headRadius * 1.1
    );
    headGrad.addColorStop(0, charSkin.highlight);
    headGrad.addColorStop(0.45, charSkin.base);
    headGrad.addColorStop(1, charSkin.shadow);

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(subjectCenterX, headCenterY, headRadius * 0.72, headRadius * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair Profile (Locked hair representation)
    ctx.fillStyle = '#0d0d0f';
    ctx.beginPath();
    ctx.ellipse(subjectCenterX, headCenterY - headRadius * 0.35, headRadius * 0.82, headRadius * 0.75, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Braids or textured curls profile
    for (let b = 0; b < 12; b++) {
      const angle = (Math.PI / 11) * b + Math.PI;
      const bx = subjectCenterX + Math.cos(angle) * (headRadius * 0.78);
      const by = headCenterY - headRadius * 0.2 + Math.sin(angle) * (headRadius * 0.82);
      ctx.beginPath();
      ctx.arc(bx, by, headRadius * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Facial Features: Cinematic Eyeline & Catchlight
    const eyeY = headCenterY - headRadius * 0.05;
    const eyeSpacing = headRadius * 0.38;
    const leftEyeX = subjectCenterX - eyeSpacing * 0.55;
    const rightEyeX = subjectCenterX + eyeSpacing * 0.55;

    // Eyebrows
    ctx.strokeStyle = '#121214';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(leftEyeX - 16, eyeY - 14);
    ctx.quadraticCurveTo(leftEyeX, eyeY - 20, leftEyeX + 16, eyeY - 12);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rightEyeX - 16, eyeY - 12);
    ctx.quadraticCurveTo(rightEyeX, eyeY - 20, rightEyeX + 16, eyeY - 14);
    ctx.stroke();

    // Eye sockets / Almond eyes
    ctx.fillStyle = '#1c130e';
    ctx.beginPath();
    ctx.ellipse(leftEyeX, eyeY, 14, 8, -0.05, 0, Math.PI * 2);
    ctx.ellipse(rightEyeX, eyeY, 14, 8, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights (Motivated by key light)
    ctx.fillStyle = isGoldenHour ? 'rgba(255, 230, 180, 0.9)' : 'rgba(255, 255, 255, 0.9)';
    const catchlightOffset = params.lighting.keyLightDirection.includes('Left') ? -4 : 4;
    ctx.beginPath();
    ctx.arc(leftEyeX + catchlightOffset, eyeY - 2, 2.4, 0, Math.PI * 2);
    ctx.arc(rightEyeX + catchlightOffset, eyeY - 2, 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Nose shadow & bridge
    ctx.fillStyle = charSkin.shadow;
    ctx.beginPath();
    ctx.moveTo(subjectCenterX, eyeY + 4);
    ctx.lineTo(subjectCenterX - 6, eyeY + headRadius * 0.3);
    ctx.lineTo(subjectCenterX + 6, eyeY + headRadius * 0.3);
    ctx.closePath();
    ctx.fill();

    // Lips
    ctx.fillStyle = '#3a201b';
    ctx.beginPath();
    ctx.ellipse(subjectCenterX, eyeY + headRadius * 0.52, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle emotional tear or gleam if sad/grief
    if (params.emotion?.toLowerCase().includes('sad') || params.emotion?.toLowerCase().includes('grief')) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(leftEyeX - 2, eyeY + 12, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  } else if (isWide) {
    // Wide / Establishing Shot: Character smaller in vast environment
    const charHeight = height * 0.42;
    const charY = height * 0.52;
    const bodyW = charHeight * 0.28;

    // Body
    ctx.fillStyle = '#131518';
    ctx.beginPath();
    ctx.ellipse(subjectCenterX, charY + charHeight * 0.55, bodyW, charHeight * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = charSkin.base;
    ctx.beginPath();
    ctx.arc(subjectCenterX, charY + charHeight * 0.12, charHeight * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#0a0a0c';
    ctx.beginPath();
    ctx.arc(subjectCenterX, charY + charHeight * 0.1, charHeight * 0.12, Math.PI, Math.PI * 2);
    ctx.fill();
  } else {
    // Medium Shot / Medium Wide / Default: Torso up
    const charHeight = height * 0.68;
    const charY = height * 0.36;
    const bodyW = charHeight * 0.35;

    // Body / Wardrobe
    const bodyGrad = ctx.createLinearGradient(subjectCenterX - bodyW, charY, subjectCenterX + bodyW, charY);
    bodyGrad.addColorStop(0, '#1c1f24');
    bodyGrad.addColorStop(0.5, '#292c34');
    bodyGrad.addColorStop(1, '#121417');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(subjectCenterX, charY + charHeight * 0.65, bodyW, charHeight * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = charSkin.shadow;
    ctx.fillRect(subjectCenterX - 22, charY + charHeight * 0.22, 44, 45);

    // Head
    const headRadius = charHeight * 0.17;
    const headCenterY = charY + charHeight * 0.12;
    const headGrad = ctx.createRadialGradient(
      subjectCenterX - headRadius * 0.3, headCenterY - headRadius * 0.2, headRadius * 0.2,
      subjectCenterX, headCenterY, headRadius * 1.1
    );
    headGrad.addColorStop(0, charSkin.highlight);
    headGrad.addColorStop(0.5, charSkin.base);
    headGrad.addColorStop(1, charSkin.shadow);

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(subjectCenterX, headCenterY, headRadius * 0.78, headRadius, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#090a0d';
    ctx.beginPath();
    ctx.arc(subjectCenterX, headCenterY - 8, headRadius * 0.92, Math.PI * 0.85, Math.PI * 2.15);
    ctx.fill();

    // Secondary Character if Two Shot
    if (isTwoShot) {
      const char2X = width * 0.74;
      const char2Skin = { base: '#684d3e', shadow: '#31221a', highlight: '#886754' };

      ctx.fillStyle = '#17191d';
      ctx.beginPath();
      ctx.ellipse(char2X, charY + charHeight * 0.68, bodyW * 1.05, charHeight * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = char2Skin.base;
      ctx.beginPath();
      ctx.ellipse(char2X, headCenterY + 4, headRadius * 0.75, headRadius * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Props Rendering (e.g. Phone, Silver necklace, Photograph)
  if (params.props && params.props.length > 0) {
    const prop = params.props[0];
    const propX = subjectCenterX + (width * 0.12);
    const propY = height * 0.72;

    if (prop.name.toLowerCase().includes('phone')) {
      ctx.fillStyle = '#08080a';
      ctx.roundRect ? ctx.roundRect(propX - 20, propY - 35, 40, 70, 6) : ctx.fillRect(propX - 20, propY - 35, 40, 70);
      ctx.fill();
      // Glowing screen reflection
      ctx.fillStyle = 'rgba(180, 210, 255, 0.4)';
      ctx.fillRect(propX - 16, propY - 30, 32, 60);
    } else if (prop.name.toLowerCase().includes('photograph') || prop.name.toLowerCase().includes('paper')) {
      ctx.fillStyle = '#ece5d8';
      ctx.save();
      ctx.translate(propX, propY);
      ctx.rotate(-0.08);
      ctx.fillRect(-28, -38, 56, 76);
      // Photo border & miniature portrait silhouette
      ctx.fillStyle = '#2d241e';
      ctx.fillRect(-22, -32, 44, 46);
      ctx.restore();
    } else if (prop.name.toLowerCase().includes('necklace') || prop.name.toLowerCase().includes('locket')) {
      ctx.strokeStyle = 'rgba(230, 235, 240, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(subjectCenterX, height * 0.62, 14, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#d8dfe6';
      ctx.beginPath();
      ctx.arc(subjectCenterX, height * 0.64, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. Cinematic Backlight / Rim Light (Kicker)
  const rimX = params.lighting.keyLightDirection.includes('Left') ? width * 0.88 : width * 0.12;
  const rimGrad = ctx.createRadialGradient(rimX, height * 0.4, 50, rimX, height * 0.4, width * 0.6);
  rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  rimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
  rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, width, height);

  // 6. Camera Lens Characteristics & Vignette
  // Shallow depth bokeh / natural optical lens falloff
  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.72);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignette.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // 7. Subtle 35mm Film Grain Layer (Simulated Kodak Vision3 5219)
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const grainIntensity = params.filmLook?.includes('Documentary') ? 14 : 7;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (pseudoRandom(i) - 0.5) * grainIntensity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 8. Return crystal-clear high quality cinematic PNG data URL
  return canvas.toDataURL('image/png');
}
