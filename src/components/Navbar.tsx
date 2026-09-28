import React, { useState } from 'react';
import { Project, AspectRatio } from '../types/cinema';
import {
  Film,
  Clapperboard,
  Users,
  MapPin,
  Package,
  ShieldCheck,
  BookOpen,
  Images,
  Download,
  Grid,
  Eye,
  Plus,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';

export type ActiveTab =
  | 'generate'
  | 'timeline'
  | 'characters'
  | 'locations'
  | 'props'
  | 'continuity'
  | 'visual-bible'
  | 'gallery';

interface NavbarProps {
  project: Project;
  allProjects: Project[];
  onSelectProject: (projectId: string) => void;
  onOpenNewMovie: () => void;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showFalseColor: boolean;
  onToggleFalseColor: () => void;
  onOpenExport: () => void;
  continuityWarningCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  allProjects,
  onSelectProject,
  onOpenNewMovie,
  activeTab,
  onTabChange,
  aspectRatio,
  onAspectRatioChange,
  showGrid,
  onToggleGrid,
  showFalseColor,
  onToggleFalseColor,
  onOpenExport,
  continuityWarningCount,
}) => {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const ratios: AspectRatio[] = ['16:9', '2.39:1', '1.85:1', '4:3', '9:16', '1:1'];

  const isBibleStage = project.productionStage === 'bible';

  const navItems = [
    { id: 'generate' as const, label: 'Workspace', icon: Clapperboard },
    { id: 'visual-bible' as const, label: 'Visual Bible', icon: BookOpen },
    { id: 'timeline' as const, label: 'Timeline', icon: Film },
    { id: 'characters' as const, label: 'Characters', icon: Users, badge: project.characters.length },
    { id: 'locations' as const, label: 'Locations', icon: MapPin, badge: project.locations.length },
    { id: 'props' as const, label: 'Props', icon: Package, badge: project.props.length },
    {
      id: 'continuity' as const,
      label: 'Continuity',
      icon: ShieldCheck,
      warningCount: continuityWarningCount,
    },
    { id: 'gallery' as const, label: 'Gallery', icon: Images, badge: project.generatedFrames.length },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0d0e12]/95 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between px-3 sm:px-6 h-14">
        {/* Left: Brand & Active Movie Project Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Film className="w-4 h-4 text-black font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-cinema text-sm tracking-widest font-bold text-white uppercase">
                  CineFrame
                </span>
                <span className="text-[9px] font-mono-data tracking-wider uppercase text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                  AI
                </span>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          {/* Active Project Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors group"
            >
              <div className="max-w-[140px] sm:max-w-[200px] truncate">
                <span className="text-xs font-bold text-white group-hover:text-amber-300 block truncate transition-colors">
                  {project.title}
                </span>
                <span className="text-[10px] text-white/40 block truncate font-mono-data">
                  {project.genre} · {project.aspectRatio}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {showProjectDropdown && (
              <div className="absolute left-0 mt-1.5 w-64 bg-[#141720] border border-white/15 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-white/10 text-[10px] uppercase font-mono-data text-white/40 font-semibold flex items-center justify-between">
                  <span>Switch Movie</span>
                  <span>{allProjects.length} Projects</span>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {allProjects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProject(p.id);
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-white/5 flex items-center justify-between transition-colors ${
                        p.id === project.id ? 'bg-amber-500/10 text-amber-300' : 'text-white/80'
                      }`}
                    >
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">{p.title}</span>
                        <span className="text-[10px] text-white/40 font-mono-data block truncate">
                          {p.genre} · {p.characters.length} Cast · {p.scenes.length} Scenes
                        </span>
                      </div>
                      {p.id === project.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowProjectDropdown(false);
                      onOpenNewMovie();
                    }}
                    className="w-full px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg font-mono-data flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ NEW MOVIE</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Prominent + NEW MOVIE Button */}
          <button
            onClick={onOpenNewMovie}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md shadow-amber-500/20 font-mono-data shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ NEW MOVIE</span>
          </button>

          {/* Stage Badge */}
          <button
            onClick={() => onTabChange(isBibleStage ? 'generate' : 'visual-bible')}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono-data font-bold border transition-colors ${
              isBibleStage
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
            title="Click to toggle between Stage 1 (Visual Bible) and Stage 2 (Scene Production)"
          >
            <span>{isBibleStage ? 'STAGE 1: VISUAL BIBLE' : 'STAGE 2: SCENES'}</span>
          </button>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.warningCount !== undefined && item.warningCount > 0 ? (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono-data border border-amber-500/30">
                    {item.warningCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Right: Aspect Ratio, Grid Toggles & Export */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Selector */}
          <div className="hidden sm:flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
            {ratios.slice(0, 4).map((r) => (
              <button
                key={r}
                onClick={() => onAspectRatioChange(r)}
                className={`px-2 py-1 text-[11px] font-mono-data rounded transition-colors ${
                  aspectRatio === r
                    ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                    : 'text-white/50 hover:text-white'
                }`}
                title={`Aspect Ratio: ${r}`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Grid Toggle */}
          <button
            onClick={onToggleGrid}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              showGrid
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
            title="Toggle Rule-of-Thirds Composition Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* False Color Toggle */}
          <button
            onClick={onToggleFalseColor}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              showFalseColor
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
            title="Toggle False Color Cinema Exposure Meter"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Export Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-lg transition-all border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Overflow */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-white/5 bg-[#0f1015]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                isActive ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
