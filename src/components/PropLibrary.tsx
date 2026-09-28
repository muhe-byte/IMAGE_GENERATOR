import React, { useState } from 'react';
import { Project, Prop } from '../types/cinema';
import { Package, Lock, Unlock, Plus, Edit3, Check, Trash2, ShieldCheck } from 'lucide-react';

interface PropLibraryProps {
  project: Project;
  onUpdateProp: (prop: Prop) => void;
  onAddProp: (prop: Prop) => void;
  onDeleteProp: (propId: string) => void;
}

export const PropLibrary: React.FC<PropLibraryProps> = ({
  project,
  onUpdateProp,
  onAddProp,
  onDeleteProp,
}) => {
  const [selectedProp, setSelectedProp] = useState<Prop | null>(project.props[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Prop>>({});

  const handleStartEdit = (prop: Prop) => {
    setSelectedProp(prop);
    setEditForm({ ...prop });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedProp || !editForm.name) return;
    const updated: Prop = {
      ...selectedProp,
      ...editForm,
    } as Prop;

    onUpdateProp(updated);
    setSelectedProp(updated);
    setIsEditing(false);
  };

  const handleCreateNew = () => {
    const newProp: Prop = {
      id: `prop-${Date.now()}`,
      name: 'New Recurring Prop',
      category: 'Hero Object',
      description: 'Key story object with consistent physical wear and materials.',
      material: 'Burnished metal and aged leather',
      recurringState: 'Carried by lead character or positioned on desk',
      referenceImages: [],
      isLocked: true,
    };
    onAddProp(newProp);
    setSelectedProp(newProp);
    setEditForm(newProp);
    setIsEditing(true);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#090a0d]">
      {/* Left Sidebar Props */}
      <div className="w-full lg:w-80 shrink-0 border-r border-white/10 bg-[#0e1015] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#12141c]">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-white">Prop Library</h3>
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
          {project.props.map((prop) => {
            const isSelected = selectedProp?.id === prop.id;
            return (
              <div
                key={prop.id}
                onClick={() => {
                  setSelectedProp(prop);
                  setIsEditing(false);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#181c26] border-amber-500/50 text-white shadow-md'
                    : 'bg-[#12141a] border-white/5 text-white/70 hover:border-white/20'
                }`}
              >
                <div>
                  <h4 className="text-xs font-semibold text-white">{prop.name}</h4>
                  <p className="text-[10px] text-white/40 truncate max-w-[170px] mt-0.5">
                    {prop.category} · {prop.material}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const updated = { ...prop, isLocked: !prop.isLocked };
                    onUpdateProp(updated);
                    if (selectedProp?.id === prop.id) setSelectedProp(updated);
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    prop.isLocked
                      ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-white/30 bg-white/5 hover:text-white'
                  }`}
                  title={prop.isLocked ? 'Prop appearance LOCKED across scenes' : 'Prop UNLOCKED'}
                >
                  {prop.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Prop Detail */}
      {selectedProp ? (
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">{selectedProp.name}</h2>
                <button
                  onClick={() => {
                    const updated = { ...selectedProp, isLocked: !selectedProp.isLocked };
                    onUpdateProp(updated);
                    setSelectedProp(updated);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-data border transition-all ${
                    selectedProp.isLocked
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                      : 'bg-white/5 border-white/15 text-white/50 hover:text-white'
                  }`}
                >
                  {selectedProp.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  <span>{selectedProp.isLocked ? 'PROP LOCKED' : 'UNLOCKED'}</span>
                </button>
              </div>
              <p className="text-xs text-white/50 mt-1 font-mono-data">
                {selectedProp.category} · {selectedProp.material}
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
                  onClick={() => handleStartEdit(selectedProp)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-medium rounded-lg transition-colors border border-white/10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Prop</span>
                </button>
              )}
            </div>
          </div>

          {selectedProp.isLocked && (
            <div className="bg-gradient-to-r from-amber-950/30 to-neutral-900 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider font-mono-data">
                  Locked Prop Continuity Active
                </h4>
                <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
                  CineFrame AI preserves this object's exact material finish, engravings, physical dimensions, and recurring wear so it appears authentic and identical in all cutaways and close-up inserts.
                </p>
              </div>
            </div>
          )}

          {/* Prop Specs */}
          <div className="bg-[#11131a] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
            <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider font-mono-data pb-2 border-b border-white/10">
              Prop Materials & Recurring State
            </h3>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Prop Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Category</label>
                  <input
                    type="text"
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Detailed Description</label>
                  <textarea
                    rows={2}
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Material & Surface Finish</label>
                  <input
                    type="text"
                    value={editForm.material || ''}
                    onChange={(e) => setEditForm({ ...editForm, material: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/40 font-mono-data mb-1">Recurring Narrative State</label>
                  <input
                    type="text"
                    value={editForm.recurringState || ''}
                    onChange={(e) => setEditForm({ ...editForm, recurringState: e.target.value })}
                    className="w-full bg-[#161822] border border-white/10 rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Object Description</span>
                  <p className="text-white/90 mt-1 leading-relaxed">{selectedProp.description}</p>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Material Specifications</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedProp.material}</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 font-mono-data uppercase block">Recurring State / Placement</span>
                  <span className="text-white font-medium mt-0.5 block">{selectedProp.recurringState}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/40 text-xs">
          Select or add a prop from the left sidebar
        </div>
      )}
    </div>
  );
};
