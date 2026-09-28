import React, { useState } from 'react';
import { Project, GeneratedFrame } from '../types/cinema';
import { X, Download, FileText, Check, Film, FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  project: Project;
  activeFrame?: GeneratedFrame;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, activeFrame, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const downloadJSONManifest = () => {
    const manifest = {
      projectTitle: project.title,
      genre: project.genre,
      visualStyle: project.visualStyle,
      aspectRatio: project.aspectRatio,
      exportTimestamp: new Date().toISOString(),
      scenes: project.scenes.map(s => {
        const frame = project.generatedFrames.find(f => f.sceneId === s.id);
        const chars = project.characters.filter(c => s.characterIds.includes(c.id)).map(c => c.name);
        const loc = project.locations.find(l => l.id === s.locationId)?.name;
        const propNames = project.props.filter(p => s.propIds.includes(p.id)).map(p => p.name);

        return {
          sceneId: s.sceneId,
          episode: s.episode,
          title: s.title,
          description: s.description,
          characters: chars,
          location: loc,
          props: propNames,
          timeOfDay: s.time,
          weather: s.weather,
          emotion: s.emotion,
          camera: {
            shotType: s.cinematography.shotType,
            angle: s.cinematography.cameraAngle,
            movement: s.cinematography.cameraMovement,
            lens: s.cinematography.lens,
            depthOfField: s.cinematography.depthOfField,
          },
          lighting: {
            preset: s.lighting.preset,
            keyDirection: s.lighting.keyLightDirection,
            contrast: s.lighting.contrastRatio,
            colorTemp: s.lighting.colorTemperature,
          },
          masterFrame: frame ? {
            id: frame.id,
            url: frame.url,
            prompt: frame.prompt,
            negativePrompt: frame.negativePrompt,
            provider: frame.provider,
            aspectRatio: frame.aspectRatio,
          } : null,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-production-manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSVManifest = () => {
    const headers = [
      'Scene ID',
      'Episode',
      'Title',
      'Characters',
      'Location',
      'Props',
      'Shot Type',
      'Lens',
      'Camera Angle',
      'Lighting Preset',
      'Key Direction',
      'Time of Day',
      'Weather',
      'Emotion',
      'Master Frame Set',
    ];

    const rows = project.scenes.map(s => {
      const frame = project.generatedFrames.find(f => f.sceneId === s.id);
      const chars = project.characters.filter(c => s.characterIds.includes(c.id)).map(c => c.name).join('; ');
      const loc = project.locations.find(l => l.id === s.locationId)?.name || '';
      const propNames = project.props.filter(p => s.propIds.includes(p.id)).map(p => p.name).join('; ');

      return [
        `"${s.sceneId}"`,
        `"${s.episode}"`,
        `"${s.title.replace(/"/g, '""')}"`,
        `"${chars}"`,
        `"${loc}"`,
        `"${propNames}"`,
        `"${s.cinematography.shotType}"`,
        `"${s.cinematography.lens}"`,
        `"${s.cinematography.cameraAngle}"`,
        `"${s.lighting.preset}"`,
        `"${s.lighting.keyLightDirection}"`,
        `"${s.time}"`,
        `"${s.weather}"`,
        `"${s.emotion}"`,
        `"${frame?.isMasterFrame ? 'YES' : 'NO'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-shot-list-manifest.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadActiveImage = () => {
    if (!activeFrame) return;
    const a = document.createElement('a');
    a.href = activeFrame.url;
    a.download = `${activeFrame.episode}-${activeFrame.sceneId}-${activeFrame.cinematography.shotType.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const downloadAllMasterFrames = () => {
    project.generatedFrames.forEach((frame, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = frame.url;
        a.download = `${frame.episode}-${frame.sceneId}-master-frame.png`;
        a.click();
      }, idx * 200);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-[#111317] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#16181d]">
          <div className="flex items-center gap-2.5">
            <Film className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-semibold text-white">Production Export Center</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <h4 className="text-xs uppercase tracking-wider text-white/40 font-mono-data mb-3">
              Production Manifests & Shot Lists
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={downloadCSVManifest}
                className="flex items-start gap-3 p-4 bg-[#16181d] hover:bg-[#1d2027] border border-white/10 hover:border-amber-500/40 rounded-lg transition-all text-left group"
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                    Export Shot List (CSV)
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Spreadsheet compatible with Movie Magic, ShotPut Pro, and Excel.
                  </div>
                </div>
              </button>

              <button
                onClick={downloadJSONManifest}
                className="flex items-start gap-3 p-4 bg-[#16181d] hover:bg-[#1d2027] border border-white/10 hover:border-amber-500/40 rounded-lg transition-all text-left group"
              >
                <FileText className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                    Production Manifest (JSON)
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Complete schema with prompts, locked references, and optical data.
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-wider text-white/40 font-mono-data mb-3">
              High-Fidelity Cinema Imagery
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeFrame && (
                <button
                  onClick={downloadActiveImage}
                  className="flex items-start gap-3 p-4 bg-[#16181d] hover:bg-[#1d2027] border border-white/10 hover:border-amber-500/40 rounded-lg transition-all text-left group"
                >
                  <Download className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                      Current Frame ({activeFrame.episode}-{activeFrame.sceneId})
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      Direct high-resolution cinema PNG with locked color science.
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={downloadAllMasterFrames}
                className="flex items-start gap-3 p-4 bg-[#16181d] hover:bg-[#1d2027] border border-white/10 hover:border-amber-500/40 rounded-lg transition-all text-left group"
              >
                <Download className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
                    Episode Master Package ({project.generatedFrames.length} Frames)
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Download all locked master frames for Episode 1 in sequence.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#16181d]">
          <span className="text-xs text-white/40 font-mono-data">
            {project.title} · {project.aspectRatio} · {project.scenes.length} Scenes Indexed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium bg-white/10 hover:bg-white/15 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
