import React, { useState } from 'react';
import { Project, VisualDNA, FilmLook, ColorLanguage, Texture } from '../types/cinema';
import { BookOpen, Palette, Film, Camera, ShieldCheck, Check, Plus, Trash2 } from 'lucide-react';

interface VisualBibleViewProps {
  project: Project;
  onUpdateVisualDNA: (dna: VisualDNA) => void;
}

export const VisualBibleView: React.FC<VisualBibleViewProps> = ({ project, onUpdateVisualDNA }) => {
  const [dna, setDna] = useState<VisualDNA>(project.visualDNA);
  const [newConstraint, setNewConstraint] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const filmLooks: FilmLook[] = [
    'Contemporary drama',
    'Thriller',
    'Mystery',
    'Crime',
    'Documentary',
    'Historical',
    'Romance',
    'Psychological drama',
    'Action',
    'Sci-fi',
    'Horror',
  ];

  const colorLanguages: ColorLanguage[] = [
    'Neutral',
    'Warm',
    'Cool',
    'Desaturated',
    'High contrast',
    'Muted',
    'Naturalistic',
    'Filmic',
  ];

  const textures: Texture[] = [
    'Clean digital cinema',
    'Subtle film grain',
    '35mm film texture',
    '16mm documentary texture',
  ];

  const handleSave = () => {
    onUpdateVisualDNA(dna);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddConstraint = () => {
    if (!newConstraint) return;
    const updated = {
      ...dna,
      negativeConstraints: [...dna.negativeConstraints, newConstraint],
    };
    setDna(updated);
    onUpdateVisualDNA(updated);
    setNewConstraint('');
  };

  const handleRemoveConstraint = (index: number) => {
    const updated = {
      ...dna,
      negativeConstraints: dna.negativeConstraints.filter((_, i) => i !== index),
    };
    setDna(updated);
    onUpdateVisualDNA(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#090a0d] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Movie Visual DNA & Cinematic Bible
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-1">
            Global production visual commandments for "{project.title}". Inherited automatically by every scene prompt.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-amber-500/20"
        >
          <Check className="w-4 h-4" />
          <span>{savedSuccess ? 'Changes Applied' : 'Save Visual Bible'}</span>
        </button>
      </div>

      {/* Core DNA Triad Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Film Look */}
        <div className="bg-[#111319] border border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80 uppercase tracking-wider font-mono-data">
            <Film className="w-4 h-4 text-amber-400" />
            <span>Film Look & Genre Tone</span>
          </div>
          <select
            value={dna.filmLook}
            onChange={(e) => setDna({ ...dna, filmLook: e.target.value as any })}
            className="w-full bg-[#161822] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
          >
            {filmLooks.map((fl) => (
              <option key={fl} value={fl} className="bg-[#161822]">
                {fl}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Sets narrative lighting contrast, shadow density, and pacing appropriate for feature drama.
          </p>
        </div>

        {/* Color Language */}
        <div className="bg-[#111319] border border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80 uppercase tracking-wider font-mono-data">
            <Palette className="w-4 h-4 text-amber-400" />
            <span>Color Language & LUT</span>
          </div>
          <select
            value={dna.colorLanguage}
            onChange={(e) => setDna({ ...dna, colorLanguage: e.target.value as any })}
            className="w-full bg-[#161822] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
          >
            {colorLanguages.map((cl) => (
              <option key={cl} value={cl} className="bg-[#161822]">
                {cl}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Muted palette maintains authentic realism; prevents cartoonish oversaturation or neon shifts.
          </p>
        </div>

        {/* Film Texture */}
        <div className="bg-[#111319] border border-white/10 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/80 uppercase tracking-wider font-mono-data">
            <Camera className="w-4 h-4 text-amber-400" />
            <span>Optical Grain & Sensor</span>
          </div>
          <select
            value={dna.texture}
            onChange={(e) => setDna({ ...dna, texture: e.target.value as any })}
            className="w-full bg-[#161822] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none"
          >
            {textures.map((t) => (
              <option key={t} value={t} className="bg-[#161822]">
                {t}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-white/40 leading-relaxed">
            Kodak Vision3 35mm grain simulation provides genuine cinematic organic texture.
          </p>
        </div>
      </div>

      {/* Camera & Lens Directorial Philosophy */}
      <div className="bg-[#111319] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
        <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono-data pb-2 border-b border-white/10">
          Director of Photography Commandments
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="block text-[11px] text-white/40 font-mono-data mb-1.5 uppercase">
              Camera Movement & Eye-Line Philosophy
            </label>
            <textarea
              rows={3}
              value={dna.cameraPhilosophy}
              onChange={(e) => setDna({ ...dna, cameraPhilosophy: e.target.value })}
              className="w-full bg-[#161822] border border-white/10 rounded-lg p-3 text-xs text-white leading-relaxed focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-white/40 font-mono-data mb-1.5 uppercase">
              Lens Discipline & Perspective Rules
            </label>
            <textarea
              rows={3}
              value={dna.lensLanguage}
              onChange={(e) => setDna({ ...dna, lensLanguage: e.target.value })}
              className="w-full bg-[#161822] border border-white/10 rounded-lg p-3 text-xs text-white leading-relaxed focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Negative Constraints & AI Anti-Slop Rules */}
      <div className="bg-[#111319] border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div>
            <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono-data">
              Strict Negative Quality Constraints
            </h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              Prohibits artificial beauty smoothing, doll skin, impossible multi-key lights, and wardrobe morphs.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {dna.negativeConstraints.map((constraint, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-lg bg-[#161822] border border-white/5 text-xs text-white/80 group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{constraint}</span>
              </div>
              <button
                onClick={() => handleRemoveConstraint(idx)}
                className="text-white/30 hover:text-rose-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={newConstraint}
            onChange={(e) => setNewConstraint(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddConstraint()}
            placeholder="Add new negative constraint (e.g. No random jewelry shifts)..."
            className="flex-1 bg-[#161822] border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-white/30 focus:outline-none"
          />
          <button
            onClick={handleAddConstraint}
            disabled={!newConstraint}
            className="flex items-center gap-1 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Constraint</span>
          </button>
        </div>
      </div>
    </div>
  );
};
