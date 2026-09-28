import React, { useState } from 'react';
import { Project, AspectRatio } from '../types/cinema';
import { Film, Sparkles, X, Plus, Check } from 'lucide-react';
import { DEFAULT_GRANULAR_LOCKS } from '../utils/continuityEngine';

interface NewMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
}

export const NewMovieModal: React.FC<NewMovieModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Contemporary Drama');
  const [projectType, setProjectType] = useState('Feature Film');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [logline, setLogline] = useState('');
  const [starterTemplate, setStarterTemplate] = useState<'blank' | 'drama' | 'scifi' | 'thriller'>('blank');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!title.trim()) return;

    let masterPrompt = '';
    let visualStyle = 'Photorealistic contemporary cinematic';
    if (starterTemplate === 'drama') {
      masterPrompt = 'A 35mm feature-film still, captured on ARRI Alexa LF with Master Prime lenses. Photorealistic naturalistic cinema, intimate eye-level staging, authentic human skin pores and soft natural texture. Motivated soft directional lighting with gentle shadow rolloff. Subdued color palette with earthy tones and deep neutral shadows.';
      visualStyle = 'Photorealistic contemporary cinematic drama';
    } else if (starterTemplate === 'scifi') {
      masterPrompt = 'Hyper-realistic hard science-fiction cinema still, captured on RED Monstro 8K with Cooke Anamorphic lenses. Industrial textured surfaces, authentic modular spacecraft architecture, functional practical lighting with cool white LEDs and amber caution panels.';
      visualStyle = 'Hard science-fiction cinema anamorphic';
    } else if (starterTemplate === 'thriller') {
      masterPrompt = 'Ultra-photorealistic modern neo-noir feature film still. Anamorphic Panavision C-Series lenses with subtle horizontal flares and shallow depth of field. High-contrast chiaroscuro lighting with sharp key-light separation and cool teal shadows.';
      visualStyle = 'Modern neo-noir thriller';
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      genre: genre.trim(),
      projectType,
      aspectRatio,
      logline: logline.trim(),
      visualStyle,
      cinematicReference: '35mm anamorphic naturalistic cinema',
      colorPalette: 'Muted naturalistic grading',
      cameraLanguage: 'Motivated character-centric framing',
      lightingLanguage: 'Motivated naturalistic soft directional light',
      masterCinematicPrompt: masterPrompt,
      productionStage: 'bible', // Start at Stage 1: Build Visual Bible
      visualBibleLocked: false,
      currentEpisode: 'EP1',
      episodes: [
        {
          id: 'ep-1',
          episodeNumber: 'EP1',
          title: 'Opening Act',
          sceneCount: 0,
        },
      ],
      characters: [],
      locations: [],
      props: [],
      scenes: [],
      generatedFrames: [],
      stateSnapshots: [],
      characterMemories: {},
      visualDNA: {
        realism: 'Photorealistic',
        filmLook: 'Contemporary drama',
        colorLanguage: 'Naturalistic',
        texture: '35mm film texture',
        cameraPhilosophy: 'Naturalistic eye-level cinema',
        lensLanguage: 'Master Primes',
        negativeConstraints: [],
        masterPrompt,
      },
      createdAt: Date.now(),
    };

    onCreateProject(newProject);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111319] border border-white/15 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Start a New Movie Project
              </h3>
              <p className="text-xs text-white/50">
                Initializes an independent visual environment and Visual Bible
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-mono-data uppercase text-white/60 block mb-1.5">
              Movie Title *
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Last Letter, Echoes, Red Horizon..."
              className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono-data uppercase text-white/60 block mb-1.5">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Drama, Thriller, Sci-Fi..."
                className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono-data uppercase text-white/60 block mb-1.5">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              >
                <option value="16:9">16:9 (Standard Widescreen)</option>
                <option value="2.39:1">2.39:1 (Anamorphic CinemaScope)</option>
                <option value="1.85:1">1.85:1 (Theatrical Flat)</option>
                <option value="4:3">4:3 (Academy)</option>
                <option value="9:16">9:16 (Vertical)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono-data uppercase text-white/60 block mb-1.5">
              Logline / Dramatic Premise
            </label>
            <textarea
              rows={2}
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder="Brief 1-2 sentence synopsis..."
              className="w-full bg-[#161822] border border-white/15 focus:border-amber-500/70 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono-data uppercase text-white/60 block mb-1.5">
              Starting Foundation
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'blank', label: 'Blank Slate' },
                { id: 'drama', label: 'Drama DNA' },
                { id: 'thriller', label: 'Thriller DNA' },
                { id: 'scifi', label: 'Sci-Fi DNA' },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setStarterTemplate(tmpl.id as any)}
                  className={`p-2.5 rounded-lg border text-xs font-mono-data text-center transition-all ${
                    starterTemplate === tmpl.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white font-mono-data"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 font-mono-data disabled:opacity-40 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create & Build Visual Bible</span>
          </button>
        </div>
      </div>
    </div>
  );
};
