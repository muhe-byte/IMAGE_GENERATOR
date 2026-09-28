import React, { useState } from 'react';
import { Project, Character, ReferenceImage } from '../types/cinema';
import { Users, Lock, Unlock, Plus, Image as ImageIcon, Check, ShieldCheck, AlertCircle, Trash2, Edit3, X } from 'lucide-react';

interface CharacterLibraryProps {
  project: Project;
  onUpdateCharacter: (character: Character) => void;
  onAddCharacter: (character: Character) => void;
  onDeleteCharacter: (characterId: string) => void;
}

export const CharacterLibrary: React.FC<CharacterLibraryProps> = ({
  project,
  onUpdateCharacter,
  onAddCharacter,
  onDeleteCharacter,
}) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(project.characters[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Character>>({});
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageType, setNewImageType] = useState<'identity' | 'costume' | 'mood'>('identity');
  const [newImageLabel, setNewImageLabel] = useState('');

  const handleStartEdit = (char: Character) => {
    setSelectedCharacter(char);
    setEditForm({ ...char });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedCharacter || !editForm.name) return;
    const updated: Character = {
      ...selectedCharacter,
      ...editForm,
    } as Character;

    onUpdateCharacter(updated);
    setSelectedCharacter(updated);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const newChar: Character = {
      id: `char-${Date.now()}`,
      name: 'New Character',
      age: 30,
      gender: 'Female',
      ethnicity: 'Contemporary',
      skinTone: 'Natural medium tone',
      faceShape: 'Oval, balanced features',
      eyeColor: 'Dark brown',
      hair: 'Dark textured hair',
      hairStyle: 'Shoulder-length natural waves',
      bodyType: 'Medium build',
      height: '5\'7"',
      clothing: 'Dark wool overcoat, grey sweater, tailored trousers',
      accessories: 'Silver wristwatch',
      personality: 'Observant, resolute',
      emotionalCharacteristics: 'Guarded determination',
      referenceImages: [],
      isLocked: true,
    };
    onAddCharacter(newChar);
    setSelectedCharacter(newChar);
    setEditForm(newChar);
    setIsEditing(true);
  };

  const handleAddReferenceImage = () => {
    if (!selectedCharacter || !newImageUrl) return;
    const newRef: ReferenceImage = {
      id: `ref-${Date.now()}`,
      url: newImageUrl,
      type: newImageType,
      label: newImageLabel || `${newImageType.toUpperCase()} Reference`,
    };

    const updated: Character = {
      ...selectedCharacter,
      referenceImages: [...selectedCharacter.referenceImages, newRef],
    };
    onUpdateCharacter(updated);
    setSelectedCharacter(updated);
    setNewImageUrl('');
    setNewImageLabel('');
  };

  const handleRemoveReferenceImage = (refId: string) => {
    if (!selectedCharacter) return;
    const updated: Character = {
      ...selectedCharacter,
      referenceImages: selectedCharacter.referenceImages.filter((r) => r.id !== refId),
    };
    onUpdateCharacter(updated);
    setSelectedCharacter(updated);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#090a0d]">
      {/* Left Cast List Sidebar */}
      <div className="w-full lg:w-80 shrink-0 border-r border-white/10 bg-[#0e1015] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-white">Character Bible</h3>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {project.characters.map((char) => {
            const isSelected = selectedCharacter?.id === char.id;
            const primaryRef = char.referenceImages[0];
            return (
              <div
                key={char.id}
                onClick={() => {
                  setSelectedCharacter(char);
                  setIsEditing(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#181c26] border-amber-500/50 text-white shadow-md'
                    : 'bg-[#12141a] border-white/5 text-white/70 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/60 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                    {primaryRef ? (
                      <img src={primaryRef.url} alt={char.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white/50">{char.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{char.name}</h4>
                    <p className="text-[10px] text-white/40 truncate max-w-[130px]">
                      {char.age}yo · {char.ethnicity}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = { ...char, isLocked: !char.isLocked };
                      onUpdateCharacter(updated);
                      if (selectedCharacter?.id === char.id) setSelectedCharacter(updated);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      char.isLocked
                        ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-white/30 bg-white/5 hover:text-white'
                    }`}
                    title={char.isLocked ? 'Identity LOCKED across scenes' : 'Identity UNLOCKED'}
                  >
                    {char.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Character Sheet Detail View */}
      {selectedCharacter ? (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-black overflow-hidden border border-white/15 shadow-xl shrink-0 flex items-center justify-center">
                {selectedCharacter.referenceImages[0] ? (
                  <img
                    src={selectedCharacter.referenceImages[0].url}
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white/40">{selectedCharacter.name[0]}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{selectedCharacter.name}</h2>
                  <button
                    onClick={() => {
                      const updated = { ...selectedCharacter, isLocked: !selectedCharacter.isLocked };
                      onUpdateCharacter(updated);
                      setSelectedCharacter(updated);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-data border transition-all ${
                      selectedCharacter.isLocked
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                        : 'bg-white/5 border-white/15 text-white/50 hover:text-white'
                    }`}
                  >
                    {selectedCharacter.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{selectedCharacter.isLocked ? 'IDENTITY LOCKED' : 'UNLOCKED'}</span>
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-1 font-mono-data">
                  {selectedCharacter.age} years old · {selectedCharacter.gender} · {selectedCharacter.ethnicity}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-4 py-2 bg-emerald-500 text-black text-xs font-semibold rounded-lg hover:bg-emerald-400 transition-colors shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 bg-white/10 text-white text-xs font-medium rounded-lg hover:bg-white/15 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleStartEdit(selectedCharacter)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors border border-white/10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Biometrics</span>
                </button>
              )}
            </div>
          </div>

          {/* Locked Identity Continuity Guarantee Banner */}
          {selectedCharacter.isLocked && (
            <div className="bg-gradient-to-r from-amber-950/30 to-neutral-900 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider font-mono-data">
                  Locked Character Identity Active
                </h4>
                <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                  CineFrame AI will preserve this character’s facial bone structure, skin undertone, hair style, age, and proportional anatomy across all scenes. Scene action descriptions cannot override these physical traits.
                </p>
              </div>
            </div>
          )}

          {/* Biometrics and Traits Grid */}
          <div className="bg-[#11131a] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono-data pb-2 border-b border-white/10">
              Biometric & Anatomical Specifications
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Character Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Age</label>
                  <input
                    type="number"
                    value={editForm.age || ''}
                    onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Ethnicity</label>
                  <input
                    type="text"
                    value={editForm.ethnicity || ''}
                    onChange={(e) => setEditForm({ ...editForm, ethnicity: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Skin Tone & Undertone</label>
                  <input
                    type="text"
                    value={editForm.skinTone || ''}
                    onChange={(e) => setEditForm({ ...editForm, skinTone: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Face Shape & Landmarks</label>
                  <input
                    type="text"
                    value={editForm.faceShape || ''}
                    onChange={(e) => setEditForm({ ...editForm, faceShape: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Eye Color & Shape</label>
                  <input
                    type="text"
                    value={editForm.eyeColor || ''}
                    onChange={(e) => setEditForm({ ...editForm, eyeColor: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Hair & Hairstyle</label>
                  <input
                    type="text"
                    value={editForm.hairStyle || ''}
                    onChange={(e) => setEditForm({ ...editForm, hairStyle: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Body Type & Height</label>
                  <input
                    type="text"
                    value={editForm.bodyType || ''}
                    onChange={(e) => setEditForm({ ...editForm, bodyType: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Accessories</label>
                  <input
                    type="text"
                    value={editForm.accessories || ''}
                    onChange={(e) => setEditForm({ ...editForm, accessories: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Default Wardrobe</label>
                  <textarea
                    rows={2}
                    value={editForm.clothing || ''}
                    onChange={(e) => setEditForm({ ...editForm, clothing: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Skin Tone</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedCharacter.skinTone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Facial Bone Structure</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedCharacter.faceShape}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Eye Color & Profile</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedCharacter.eyeColor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Hairstyle & Texture</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedCharacter.hairStyle}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Build & Height</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedCharacter.bodyType} · {selectedCharacter.height}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Signature Accessories</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedCharacter.accessories || 'None'}</span>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Default Wardrobe Specification</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedCharacter.clothing}</span>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Emotional Characteristics & Subtext</span>
                  <span className="text-white/80 mt-0.5 block italic">{selectedCharacter.emotionalCharacteristics}</span>
                </div>
              </div>
            )}
          </div>

          {/* Reference Images Gallery (Distinguished by Identity, Costume, Mood) */}
          <div className="bg-[#11131a] border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono-data">
                  Character Reference Library
                </h3>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Distinguishes Identity References (face/proportions) from Costume & Mood references.
                </p>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedCharacter.referenceImages.map((ref) => (
                <div key={ref.id} className="relative group rounded-lg overflow-hidden border border-white/15 bg-black">
                  <div className="aspect-square">
                    <img src={ref.url} alt={ref.label || 'Reference'} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2.5">
                    <span className={`text-[9px] uppercase font-mono-data px-1.5 py-0.5 rounded font-bold ${
                      ref.type === 'identity'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : ref.type === 'costume'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {ref.type} REF
                    </span>
                    <div className="text-xs text-white font-medium truncate mt-1">{ref.label}</div>
                  </div>

                  <button
                    onClick={() => handleRemoveReferenceImage(ref.id)}
                    className="absolute top-2 right-2 p-1 rounded bg-black/70 text-white/60 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove reference photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Reference Image Input */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste reference image URL..."
                className="flex-1 bg-[#161822] border border-white/10 rounded p-2 text-xs text-white placeholder-white/30 focus:outline-none"
              />
              <select
                value={newImageType}
                onChange={(e) => setNewImageType(e.target.value as any)}
                className="bg-[#161822] border border-white/10 rounded p-2 text-xs text-white focus:outline-none"
              >
                <option value="identity">Identity Ref</option>
                <option value="costume">Costume Ref</option>
                <option value="mood">Mood Ref</option>
              </select>
              <input
                type="text"
                value={newImageLabel}
                onChange={(e) => setNewImageLabel(e.target.value)}
                placeholder="Label / Notes..."
                className="w-36 bg-[#161822] border border-white/10 rounded p-2 text-xs text-white placeholder-white/30 focus:outline-none"
              />
              <button
                onClick={handleAddReferenceImage}
                disabled={!newImageUrl}
                className="px-3 py-2 bg-white/15 hover:bg-white/20 text-white text-xs font-medium rounded transition-colors disabled:opacity-40"
              >
                Attach
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/40 text-xs">
          Select or add a character from the left sidebar
        </div>
      )}
    </div>
  );
};
