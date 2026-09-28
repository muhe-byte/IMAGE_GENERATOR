import React, { useState } from 'react';
import {
  Project,
  Character,
  Location,
  Prop,
  ReferenceImage,
  AspectRatio,
} from '../types/cinema';
import {
  Sparkles,
  Film,
  User,
  Users,
  MapPin,
  Package,
  Layers,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  Camera,
  Palette,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { synthesizeCinematicFrame } from '../utils/cinematicSynthesizer';

interface VisualBibleBuilderProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onLockVisualBible: () => void;
}

export const VisualBibleBuilder: React.FC<VisualBibleBuilderProps> = ({
  project,
  onUpdateProject,
  onLockVisualBible,
}) => {
  const [activeStep, setActiveStep] = useState<'info' | 'characters' | 'locations' | 'props' | 'master_prompt'>('info');

  // Form states for adding a new character
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [newCharAge, setNewCharAge] = useState('');
  const [newCharClothing, setNewCharClothing] = useState('');
  const [newCharMode, setNewCharMode] = useState<'reference' | 'generated' | 'hybrid'>('reference');
  const [newCharImages, setNewCharImages] = useState<string[]>([]);
  const [isGeneratingCharPortrait, setIsGeneratingCharPortrait] = useState(false);

  // Form states for adding a new location
  const [newLocName, setNewLocName] = useState('');
  const [newLocDesc, setNewLocDesc] = useState('');
  const [newLocArch, setNewLocArch] = useState('');
  const [newLocIsInterior, setNewLocIsInterior] = useState(true);
  const [newLocImages, setNewLocImages] = useState<string[]>([]);

  // Form states for adding a new prop
  const [newPropName, setNewPropName] = useState('');
  const [newPropDesc, setNewPropDesc] = useState('');
  const [newPropCategory, setNewPropCategory] = useState('Personal Object');
  const [newPropImages, setNewPropImages] = useState<string[]>([]);

  // Master Cinematic Prompt Presets
  const masterPromptPresets = [
    {
      title: 'Contemporary Cinematic Drama',
      genre: 'Drama',
      prompt:
        'A 35mm feature-film still, captured on ARRI Alexa LF with Master Prime lenses. Photorealistic naturalistic cinema, intimate eye-level staging, authentic human skin pores and soft natural texture. Motivated soft directional lighting with gentle shadow rolloff. Subdued color palette with earthy tones and deep neutral shadows. Subtle Kodak Vision3 500T film grain, true optical anamorphic bokeh, no airbrushing or digital beauty filters.',
    },
    {
      title: 'Atmospheric Thriller / Neo-Noir',
      genre: 'Thriller / Mystery',
      prompt:
        'Ultra-photorealistic modern neo-noir feature film still. Anamorphic Panavision C-Series lenses with subtle horizontal flares and shallow depth of field. High-contrast chiaroscuro lighting with sharp key-light separation and cool teal shadows. Wet asphalt reflections, subtle atmospheric haze, naturalistic film grain, restrained desaturated color palette with intense motivated highlights.',
    },
    {
      title: 'Grounded Hard Sci-Fi',
      genre: 'Sci-Fi',
      prompt:
        'Hyper-realistic hard science-fiction cinema still, captured on RED Monstro 8K with Cooke Anamorphic lenses. Industrial textured surfaces, authentic modular spacecraft architecture, functional practical lighting with cool white LEDs and amber caution panels. Natural optical lens dispersion, true zero-g or planetary atmospheric diffusion, uncompromising mechanical realism.',
    },
    {
      title: 'Historical Period Film',
      genre: 'Historical / Period',
      prompt:
        'Period cinematic 35mm film still, warm Kodak Eastman color science. Organic tungsten candlelight and diffuse overcast daylight through aged glass. Authentic period garment weaves, wool, linen, and aged leather. Painterly composition reminiscent of master oil portraiture, subtle lens vignettes, gentle halation around practical lights.',
    },
  ];

  // Image Upload Helper
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add Character
  const handleAddCharacter = () => {
    if (!newCharName.trim()) return;

    const refImages: ReferenceImage[] = newCharImages.map((img, i) => ({
      id: `ref-char-${Date.now()}-${i}`,
      url: img,
      type: 'identity',
      role: 'identity',
      level: 1,
      label: `${newCharName} Reference ${i + 1}`,
    }));

    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: newCharName.trim(),
      age: newCharAge.trim() || 'Adult',
      gender: 'Specified in description',
      ethnicity: 'Specified in description',
      skinTone: 'Natural',
      faceShape: 'Natural bone structure',
      eyeColor: 'Natural',
      hair: 'As shown in reference',
      hairStyle: 'As shown in reference',
      bodyType: 'Proportional',
      height: 'Standard',
      clothing: newCharClothing.trim() || 'Contemporary wardrobe',
      accessories: '',
      personality: 'Complex film character',
      emotionalCharacteristics: 'Emotionally resonant',
      description: newCharDesc.trim(),
      creationMode: newCharMode,
      referenceImages: refImages,
      avatarUrl: refImages[0]?.url,
      isLocked: true, // Auto-locked by default for identity preservation
    };

    onUpdateProject({
      ...project,
      characters: [...project.characters, newChar],
    });

    setNewCharName('');
    setNewCharDesc('');
    setNewCharAge('');
    setNewCharClothing('');
    setNewCharImages([]);
  };

  // Generate Character Portrait (Generated Character Mode)
  const handleGenerateCharacterPortrait = async () => {
    if (!newCharName.trim()) return;
    setIsGeneratingCharPortrait(true);
    try {
      const dummyChar: Character = {
        id: `temp-${Date.now()}`,
        name: newCharName,
        age: newCharAge || 'Adult',
        gender: 'Specified in description',
        ethnicity: 'Specified in description',
        skinTone: 'Natural',
        faceShape: 'Natural bone structure',
        eyeColor: 'Natural',
        hair: 'As described',
        hairStyle: 'Natural styling',
        bodyType: 'Proportional',
        height: 'Standard',
        clothing: newCharClothing || 'Contemporary wardrobe',
        accessories: '',
        personality: '',
        emotionalCharacteristics: '',
        referenceImages: [],
        isLocked: true,
      };
      const synthetic = synthesizeCinematicFrame({
        aspectRatio: '1:1',
        sceneTitle: `${newCharName} Identity Reference`,
        sceneId: 'REF-PORTRAIT',
        cinematography: {
          shotType: 'Close-Up',
          cameraAngle: 'Eye level',
          cameraMovement: 'Static',
          lens: '85mm',
          depthOfField: 'Extremely shallow cinematic depth',
          focusTarget: 'Character',
        },
        lighting: {
          preset: 'Natural daylight',
          keyLightDirection: 'Camera Left 45°',
          fillIntensity: 35,
          backlight: 40,
          contrastRatio: 'Moderate 4:1',
          shadowDensity: 'Soft diffuse',
          colorTemperature: '5600K Daylight',
          ambientLight: 30,
        },
        filmLook: project.visualDNA?.filmLook || 'Contemporary drama',
        characters: [dummyChar],
        emotion: 'Neutral baseline expression',
        time: 'Daylight',
      });
      setNewCharImages((prev) => [synthetic, ...prev]);
    } catch (e) {
      console.warn('Failed to generate portrait:', e);
    } finally {
      setIsGeneratingCharPortrait(false);
    }
  };

  // Delete Character
  const handleDeleteCharacter = (charId: string) => {
    onUpdateProject({
      ...project,
      characters: project.characters.filter((c) => c.id !== charId),
    });
  };

  // Toggle Character Lock
  const handleToggleCharLock = (charId: string) => {
    onUpdateProject({
      ...project,
      characters: project.characters.map((c) =>
        c.id === charId ? { ...c, isLocked: !c.isLocked } : c
      ),
    });
  };

  // Add Location
  const handleAddLocation = () => {
    if (!newLocName.trim()) return;

    const refImages: ReferenceImage[] = newLocImages.map((img, i) => ({
      id: `ref-loc-${Date.now()}-${i}`,
      url: img,
      type: 'architecture',
      role: 'location',
      level: 2,
      label: `${newLocName} Set Photo ${i + 1}`,
    }));

    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      name: newLocName.trim(),
      description: newLocDesc.trim(),
      architecture: newLocArch.trim() || 'Physical architectural space',
      isInterior: newLocIsInterior,
      furniture: 'Continuous practical furnishings',
      walls: 'Textured walls',
      windows: 'Standard architectural windows',
      doors: 'Practical doors',
      props: 'Dressed set elements',
      colorPalette: 'Motivated set colors',
      lighting: 'Motivated naturalistic lighting',
      referenceImages: refImages,
      isLocked: true,
      architectureLocked: true,
      layoutLocked: true,
      environmentLocked: true,
    };

    onUpdateProject({
      ...project,
      locations: [...project.locations, newLoc],
    });

    setNewLocName('');
    setNewLocDesc('');
    setNewLocArch('');
    setNewLocImages([]);
  };

  // Delete Location
  const handleDeleteLocation = (locId: string) => {
    onUpdateProject({
      ...project,
      locations: project.locations.filter((l) => l.id !== locId),
    });
  };

  // Add Prop
  const handleAddProp = () => {
    if (!newPropName.trim()) return;

    const refImages: ReferenceImage[] = newPropImages.map((img, i) => ({
      id: `ref-prop-${Date.now()}-${i}`,
      url: img,
      type: 'prop',
      role: 'prop',
      level: 3,
      label: `${newPropName} Reference ${i + 1}`,
    }));

    const newProp: Prop = {
      id: `prop-${Date.now()}`,
      name: newPropName.trim(),
      category: newPropCategory,
      description: newPropDesc.trim(),
      material: 'Authentic physical material',
      recurringState: 'Locked continuous state',
      referenceImages: refImages,
      isLocked: true,
    };

    onUpdateProject({
      ...project,
      props: [...project.props, newProp],
    });

    setNewPropName('');
    setNewPropDesc('');
    setNewPropImages([]);
  };

  // Delete Prop
  const handleDeleteProp = (propId: string) => {
    onUpdateProject({
      ...project,
      props: project.props.filter((p) => p.id !== propId),
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#090a0d] p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono-data font-bold bg-amber-500 text-black">
              STAGE 1
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Build the Movie Visual Bible
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-1 max-w-2xl">
            Establish authoritative visual references, character identity locks, set architectures, and the Master Cinematic Prompt before shooting scenes.
          </p>
        </div>

        {/* Action Button: Lock Visual Bible and Start Shooting */}
        <button
          onClick={onLockVisualBible}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 font-mono-data shrink-0"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>LOCK VISUAL BIBLE & ENTER PRODUCTION</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stage 1 Step Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        {[
          { id: 'info', label: '1. Movie Setup', icon: Film, count: null },
          { id: 'characters', label: '2. Character References', icon: Users, count: project.characters.length },
          { id: 'locations', label: '3. Location Sets', icon: MapPin, count: project.locations.length },
          { id: 'props', label: '4. Hero Props', icon: Package, count: project.props.length },
          { id: 'master_prompt', label: '5. Master Cinematic Prompt', icon: Sparkles, count: project.masterCinematicPrompt ? 'Ready' : 'Pending' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeStep === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStep(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold font-mono-data transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-white/60 hover:text-white bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* STEP 1: MOVIE SETUP                                      */}
      {/* ======================================================== */}
      {activeStep === 'info' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-[#111319] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono-data pb-2 border-b border-white/10 flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-500" />
              <span>Project Core Parameters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1.5">
                  Movie Title
                </label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => onUpdateProject({ ...project, title: e.target.value })}
                  placeholder="e.g. The Last Letter, Echoes of Silence, Project Aegis..."
                  className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1.5">
                  Genre & Tone
                </label>
                <input
                  type="text"
                  value={project.genre}
                  onChange={(e) => onUpdateProject({ ...project, genre: e.target.value })}
                  placeholder="e.g. Social Drama, Sci-Fi Mystery, Psychological Thriller, Romance..."
                  className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-white/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1.5">
                  Project Format
                </label>
                <select
                  value={project.projectType || 'Feature Film'}
                  onChange={(e) => onUpdateProject({ ...project, projectType: e.target.value })}
                  className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="Feature Film">Feature Film</option>
                  <option value="Episodic Series">Episodic Series</option>
                  <option value="Short Film">Short Film</option>
                  <option value="Documentary-Style Film">Documentary-Style Film</option>
                  <option value="AI Movie">AI-Generated Movie</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1.5">
                  Cinematic Aspect Ratio
                </label>
                <select
                  value={project.aspectRatio}
                  onChange={(e) => onUpdateProject({ ...project, aspectRatio: e.target.value as AspectRatio })}
                  className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="16:9">16:9 (Standard Widescreen HD / 4K)</option>
                  <option value="2.39:1">2.39:1 (Anamorphic CinemaScope)</option>
                  <option value="1.85:1">1.85:1 (Flat Theatrical Standard)</option>
                  <option value="4:3">4:3 (Academy Ratio)</option>
                  <option value="9:16">9:16 (Vertical Cinematic)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1.5">
                Logline / Story Premise
              </label>
              <textarea
                rows={2}
                value={project.logline || ''}
                onChange={(e) => onUpdateProject({ ...project, logline: e.target.value })}
                placeholder="A brief 1-2 sentence synopsis describing the core dramatic conflict and world..."
                className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-lg p-3 text-xs text-white placeholder-white/20 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setActiveStep('characters')}
              className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 font-mono-data"
            >
              <span>Next: Character References</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: CHARACTER REFERENCES (REFERENCE / GENERATED)     */}
      {/* ======================================================== */}
      {activeStep === 'characters' && (
        <div className="space-y-6">
          {/* Add Character Form */}
          <div className="bg-[#111319] border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono-data">
                  Add Movie Character
                </h3>
              </div>
              <span className="text-[11px] text-white/40 font-mono-data">
                Supports Reference Mode, Generated Mode, or Hybrid
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Character Name *
                </label>
                <input
                  type="text"
                  value={newCharName}
                  onChange={(e) => setNewCharName(e.target.value)}
                  placeholder="e.g. Maya, Ethan, Anna, Marcus..."
                  className="w-full bg-[#161822] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Age / Demographic
                </label>
                <input
                  type="text"
                  value={newCharAge}
                  onChange={(e) => setNewCharAge(e.target.value)}
                  placeholder="e.g. 34yo, Child (4yo), Elder..."
                  className="w-full bg-[#161822] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Reference Mode
                </label>
                <select
                  value={newCharMode}
                  onChange={(e) => setNewCharMode(e.target.value as any)}
                  className="w-full bg-[#161822] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/70"
                >
                  <option value="reference">Reference Mode (Upload Images)</option>
                  <option value="generated">Generated Mode (Create via AI)</option>
                  <option value="hybrid">Hybrid Mode (Upload & AI)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Physical Description & Biometrics
                </label>
                <textarea
                  rows={2}
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="e.g. Ethiopian descent, warm brown eyes, high cheekbones, natural braided hair, compassionate expression..."
                  className="w-full bg-[#161822] border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder-white/20 focus:outline-none resize-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Default / Canonical Wardrobe
                </label>
                <textarea
                  rows={2}
                  value={newCharClothing}
                  onChange={(e) => setNewCharClothing(e.target.value)}
                  placeholder="e.g. Woven gray wool sweater, dark tailored trousers, worn canvas boots..."
                  className="w-full bg-[#161822] border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder-white/20 focus:outline-none resize-none focus:border-amber-500/70"
                />
              </div>
            </div>

            {/* Reference Upload / Portrait Generation */}
            <div>
              <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-2">
                Identity Reference Images (Level 1 Authority)
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {/* Upload Button */}
                <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg text-xs text-white font-mono-data flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Reference Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, setNewCharImages)}
                    className="hidden"
                  />
                </label>

                {/* AI Portrait Generator (Generated Mode) */}
                <button
                  type="button"
                  onClick={handleGenerateCharacterPortrait}
                  disabled={!newCharName || isGeneratingCharPortrait}
                  className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-mono-data flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  {isGeneratingCharPortrait ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Initial Portrait</span>
                </button>

                <span className="text-[11px] text-white/40">
                  {newCharImages.length} image{newCharImages.length === 1 ? '' : 's'} staged
                </span>
              </div>

              {/* Preview staged images */}
              {newCharImages.length > 0 && (
                <div className="flex items-center gap-3 mt-3 overflow-x-auto py-1">
                  {newCharImages.map((img, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20 shrink-0 group">
                      <img src={img} alt="Ref" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setNewCharImages(newCharImages.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                onClick={handleAddCharacter}
                disabled={!newCharName.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 font-mono-data"
              >
                <Plus className="w-4 h-4" />
                <span>Save Character to Bible</span>
              </button>
            </div>
          </div>

          {/* Character Library Grid */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono-data block">
              Configured Movie Characters ({project.characters.length})
            </span>

            {project.characters.length === 0 ? (
              <div className="p-8 bg-[#111319] border border-white/10 rounded-xl text-center text-white/40 text-xs">
                No characters added yet. Add characters above to establish their identity locks.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.characters.map((char) => {
                  const refImage = char.referenceImages?.[0]?.url || char.avatarUrl;
                  return (
                    <div
                      key={char.id}
                      className="p-4 bg-[#111319] border border-white/10 rounded-xl space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0">
                            {refImage ? (
                              <img src={refImage} alt={char.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30 font-bold text-sm font-mono-data">
                                {char.name[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white block">{char.name}</span>
                            <span className="text-[11px] text-white/40 font-mono-data">
                              {char.age} · {char.referenceImages?.length || 0} refs
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleCharLock(char.id)}
                            className={`p-1.5 rounded transition-colors ${
                              char.isLocked
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-white/5 text-white/40'
                            }`}
                            title={char.isLocked ? 'Identity Locked' : 'Unlocked'}
                          >
                            {char.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleDeleteCharacter(char.id)}
                            className="p-1.5 text-white/40 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {char.description && (
                        <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                          {char.description}
                        </p>
                      )}

                      {char.clothing && (
                        <div className="text-[10px] text-white/50 font-mono-data bg-black/40 p-2 rounded border border-white/5">
                          <span className="text-amber-400/80">Wardrobe:</span> {char.clothing}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setActiveStep('info')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg font-mono-data"
            >
              Back: Movie Setup
            </button>
            <button
              onClick={() => setActiveStep('locations')}
              className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 font-mono-data"
            >
              <span>Next: Location Sets</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: LOCATION REFERENCES                              */}
      {/* ======================================================== */}
      {activeStep === 'locations' && (
        <div className="space-y-6">
          <div className="bg-[#111319] border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono-data">
                  Add Movie Location / Set (Optional)
                </h3>
              </div>
              <span className="text-[11px] text-white/40 font-mono-data">
                Architecture & Room Layout Continuity
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="e.g. Maya's House, Space Station Hub, Anna's Kitchen..."
                  className="w-full bg-[#161822] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Environment Type
                </label>
                <select
                  value={newLocIsInterior ? 'interior' : 'exterior'}
                  onChange={(e) => setNewLocIsInterior(e.target.value === 'interior')}
                  className="w-full bg-[#161822] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/70"
                >
                  <option value="interior">Interior Set</option>
                  <option value="exterior">Exterior Location</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Architectural Materials / Windows / Doors
                </label>
                <input
                  type="text"
                  value={newLocArch}
                  onChange={(e) => setNewLocArch(e.target.value)}
                  placeholder="e.g. Wooden window frames, plaster walls, mahogany front door..."
                  className="w-full bg-[#161822] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/70"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                Spatial Description & Dressing
              </label>
              <textarea
                rows={2}
                value={newLocDesc}
                onChange={(e) => setNewLocDesc(e.target.value)}
                placeholder="Describe layout, furniture placement, windows, and atmosphere to lock continuous room geometry..."
                className="w-full bg-[#161822] border border-white/15 rounded-lg p-2.5 text-xs text-white placeholder-white/20 focus:outline-none resize-none focus:border-amber-500/70"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-2">
                Set Reference Photos
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg text-xs text-white font-mono-data transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Set Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setNewLocImages)}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-white/40 ml-3">
                {newLocImages.length} photo{newLocImages.length === 1 ? '' : 's'} staged
              </span>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                onClick={handleAddLocation}
                disabled={!newLocName.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 font-mono-data"
              >
                <Plus className="w-4 h-4" />
                <span>Save Set to Bible</span>
              </button>
            </div>
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.locations.map((loc) => (
              <div key={loc.id} className="p-4 bg-[#111319] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{loc.name}</span>
                  <button
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="text-white/40 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-white/60 line-clamp-2">{loc.description}</p>
                <div className="text-[10px] text-white/40 font-mono-data">
                  {loc.isInterior ? 'Interior' : 'Exterior'} · {loc.architecture}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setActiveStep('characters')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg font-mono-data"
            >
              Back: Characters
            </button>
            <button
              onClick={() => setActiveStep('props')}
              className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 font-mono-data"
            >
              <span>Next: Hero Props</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: HERO PROPS                                       */}
      {/* ======================================================== */}
      {activeStep === 'props' && (
        <div className="space-y-6">
          <div className="bg-[#111319] border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono-data">
                  Add Recurring Hero Props (Optional)
                </h3>
              </div>
              <span className="text-[11px] text-white/40 font-mono-data">
                Phone, letters, car, weapon, baby blanket, keys...
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Prop Name *
                </label>
                <input
                  type="text"
                  value={newPropName}
                  onChange={(e) => setNewPropName(e.target.value)}
                  placeholder="e.g. Maya's Phone, Old Letter, Silver Locket..."
                  className="w-full bg-[#161822] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/70"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1">
                  Description / Locked Material Appearance
                </label>
                <input
                  type="text"
                  value={newPropDesc}
                  onChange={(e) => setNewPropDesc(e.target.value)}
                  placeholder="e.g. Scratched black smartphone with blue silicone case, folded yellowed stationery..."
                  className="w-full bg-[#161822] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-500/70"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                onClick={handleAddProp}
                disabled={!newPropName.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 font-mono-data"
              >
                <Plus className="w-4 h-4" />
                <span>Save Prop to Bible</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {project.props.map((p) => (
              <div key={p.id} className="p-3 bg-[#111319] border border-white/10 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">{p.name}</span>
                  <span className="text-[10px] text-white/50">{p.description}</span>
                </div>
                <button onClick={() => handleDeleteProp(p.id)} className="text-white/40 hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setActiveStep('locations')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-xs rounded-lg font-mono-data"
            >
              Back: Location Sets
            </button>
            <button
              onClick={() => setActiveStep('master_prompt')}
              className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 font-mono-data"
            >
              <span>Next: Master Cinematic Prompt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 5: MASTER CINEMATIC PROMPT (PROJECT VISUAL DNA)     */}
      {/* ======================================================== */}
      {activeStep === 'master_prompt' && (
        <div className="space-y-6 max-w-4xl">
          <div className="bg-[#111319] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
            <div className="pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono-data">
                  Master Cinematic Prompt & Visual DNA
                </h3>
              </div>
              <p className="text-xs text-white/50 mt-1">
                This defines the overall visual language (photorealism, camera, lens preferences, lighting, color grading, film texture). Every future scene automatically inherits these rules unless overridden.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono-data uppercase text-white/50 block">
                Load Cinematic Reference Style Preset:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {masterPromptPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onUpdateProject({
                        ...project,
                        genre: preset.genre,
                        masterCinematicPrompt: preset.prompt,
                        visualDNA: {
                          ...project.visualDNA,
                          masterPrompt: preset.prompt,
                        },
                      });
                    }}
                    className="p-3 bg-[#161822] hover:bg-[#1f2230] border border-white/10 hover:border-amber-500/50 rounded-lg text-left transition-all group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 block">
                      {preset.title}
                    </span>
                    <span className="text-[10px] text-white/40 block mt-0.5 font-mono-data">
                      {preset.genre}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Master Prompt Textarea */}
            <div>
              <label className="text-[11px] font-mono-data uppercase text-white/50 block mb-1.5">
                Master Cinematic Prompt (Project Visual DNA)
              </label>
              <textarea
                rows={6}
                value={project.masterCinematicPrompt || project.visualDNA?.masterPrompt || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateProject({
                    ...project,
                    masterCinematicPrompt: val,
                    visualDNA: {
                      ...project.visualDNA,
                      masterPrompt: val,
                    },
                  });
                }}
                placeholder="Paste or write your movie's master cinematic prompt here..."
                className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-xl p-4 text-xs text-white font-mono-data placeholder-white/20 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Lock Visual Bible Final Action */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-white/50 font-mono-data">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  {project.characters.length} Characters · {project.locations.length} Sets · {project.props.length} Props
                </span>
              </div>

              <button
                onClick={onLockVisualBible}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/25 font-mono-data flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>LOCK VISUAL BIBLE & ENTER PRODUCTION</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
