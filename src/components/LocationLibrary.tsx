import React, { useState } from 'react';
import { Project, Location, ReferenceImage } from '../types/cinema';
import { MapPin, Lock, Unlock, Plus, Edit3, Check, Trash2, ShieldCheck, Home } from 'lucide-react';

interface LocationLibraryProps {
  project: Project;
  onUpdateLocation: (location: Location) => void;
  onAddLocation: (location: Location) => void;
  onDeleteLocation: (locationId: string) => void;
}

export const LocationLibrary: React.FC<LocationLibraryProps> = ({
  project,
  onUpdateLocation,
  onAddLocation,
  onDeleteLocation,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(project.locations[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Location>>({});

  const handleStartEdit = (loc: Location) => {
    setSelectedLocation(loc);
    setEditForm({ ...loc });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedLocation || !editForm.name) return;
    const updated: Location = {
      ...selectedLocation,
      ...editForm,
    } as Location;

    onUpdateLocation(updated);
    setSelectedLocation(updated);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const newLoc: Location = {
      id: `loc-${Date.now()}`,
      name: 'New Location Set',
      description: 'Atmospheric cinematic environment designed for visual storytelling.',
      architecture: 'Contemporary urban / industrial',
      isInterior: true,
      furniture: 'Simple functional wooden furniture',
      walls: 'Textured concrete plaster',
      windows: 'Large multi-paned casement windows',
      doors: 'Heavy wooden acoustic door',
      props: 'Desk lamps, filing boxes',
      colorPalette: 'Neutral grey, amber warmth, deep shadow',
      lighting: 'Natural side daylight filtering through curtains',
      referenceImages: [],
      isLocked: true,
    };
    onAddLocation(newLoc);
    setSelectedLocation(newLoc);
    setEditForm(newLoc);
    setIsEditing(true);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#090a0d]">
      {/* Left Sidebar Locations */}
      <div className="w-full lg:w-80 shrink-0 border-r border-white/10 bg-[#0e1015] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-white">Location Bible</h3>
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
          {project.locations.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            return (
              <div
                key={loc.id}
                onClick={() => {
                  setSelectedLocation(loc);
                  setIsEditing(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#181c26] border-amber-500/50 text-white shadow-md'
                    : 'bg-[#12141a] border-white/5 text-white/70 hover:border-white/20'
                }`}
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{loc.name}</h4>
                  <p className="text-[10px] text-white/40 truncate max-w-[170px] mt-0.5">
                    {loc.isInterior ? 'Interior' : 'Exterior'} · {loc.architecture}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = { ...loc, isLocked: !loc.isLocked };
                    onUpdateLocation(updated);
                    if (selectedLocation?.id === loc.id) setSelectedLocation(updated);
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    loc.isLocked
                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-white/30 bg-white/5 hover:text-white'
                  }`}
                  title={loc.isLocked ? 'Location LOCKED across scenes' : 'Location UNLOCKED'}
                >
                  {loc.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Location Detail View */}
      {selectedLocation ? (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{selectedLocation.name}</h2>
                <button
                  onClick={() => {
                    const updated = { ...selectedLocation, isLocked: !selectedLocation.isLocked };
                    onUpdateLocation(updated);
                    setSelectedLocation(updated);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-data border transition-all ${
                    selectedLocation.isLocked
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                      : 'bg-white/5 border-white/15 text-white/50 hover:text-white'
                  }`}
                >
                  {selectedLocation.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  <span>{selectedLocation.isLocked ? 'LOCATION LOCKED' : 'UNLOCKED'}</span>
                </button>
              </div>
              <p className="text-xs text-white/50 mt-1 font-mono-data">
                {selectedLocation.isInterior ? 'Interior Set' : 'Exterior Environment'} · {selectedLocation.architecture}
              </p>
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
                  onClick={() => handleStartEdit(selectedLocation)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors border border-white/10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Location</span>
                </button>
              )}
            </div>
          </div>

          {/* Locked Architecture Banner */}
          {selectedLocation.isLocked && (
            <div className="bg-gradient-to-r from-amber-950/30 to-neutral-900 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider font-mono-data">
                  Locked Architecture & Spatial Layout Active
                </h4>
                <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                  CineFrame AI will preserve this location’s window placement, door positions, wall materials, and physical geometry. The camera can move freely inside without rooms randomly changing shape or architectural elements disappearing.
                </p>
              </div>
            </div>
          )}

          {/* Location Architecture & Environmental Sheet */}
          <div className="bg-[#11131a] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono-data pb-2 border-b border-white/10">
              Architectural & Spatial Parameters
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Set Description</label>
                  <textarea
                    rows={3}
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Architecture Style</label>
                  <input
                    type="text"
                    value={editForm.architecture || ''}
                    onChange={(e) => setEditForm({ ...editForm, architecture: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Walls & Textures</label>
                  <input
                    type="text"
                    value={editForm.walls || ''}
                    onChange={(e) => setEditForm({ ...editForm, walls: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Windows & Natural Light</label>
                  <input
                    type="text"
                    value={editForm.windows || ''}
                    onChange={(e) => setEditForm({ ...editForm, windows: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Doors & Exits</label>
                  <input
                    type="text"
                    value={editForm.doors || ''}
                    onChange={(e) => setEditForm({ ...editForm, doors: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Furniture & Fixed Props</label>
                  <input
                    type="text"
                    value={editForm.furniture || ''}
                    onChange={(e) => setEditForm({ ...editForm, furniture: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Color Palette</label>
                  <input
                    type="text"
                    value={editForm.colorPalette || ''}
                    onChange={(e) => setEditForm({ ...editForm, colorPalette: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Motivated Lighting</label>
                  <input
                    type="text"
                    value={editForm.lighting || ''}
                    onChange={(e) => setEditForm({ ...editForm, lighting: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Environment Narrative</span>
                  <p className="text-white/90 mt-1 leading-relaxed">{selectedLocation.description}</p>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Architecture Style</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedLocation.architecture}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Walls & Surfaces</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedLocation.walls}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Windows & Light Motivation</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedLocation.windows}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Doors & Spatial Exits</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedLocation.doors}</span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Key Furniture & Set Dressing</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedLocation.furniture}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Color Palette</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedLocation.colorPalette}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Natural Lighting Architecture</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedLocation.lighting}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/40 text-xs">
          Select or add a location from the left sidebar
        </div>
      )}
    </div>
  );
};
