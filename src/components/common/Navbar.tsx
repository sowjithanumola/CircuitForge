import React, { useState } from 'react';
import { EditorMode, SimulationState } from '../../types/circuit';
import {
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  FolderOpen,
  Download,
  Upload,
  Keyboard,
  Shield,
  FileText,
  Edit2,
  Check,
  Cpu,
  Layers,
  Flame,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  activeMode: EditorMode;
  onChangeMode: (mode: EditorMode) => void;
  simulationState: SimulationState;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onOpenGallery: () => void;
  onOpenLearning: () => void;
  onOpenShortcuts: () => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
  onExportJson: () => void;
  onImportJsonClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  onUpdateProjectName,
  activeMode,
  onChangeMode,
  simulationState,
  onToggleSimulation,
  onResetSimulation,
  onOpenGallery,
  onOpenLearning,
  onOpenShortcuts,
  onOpenLegal,
  onExportJson,
  onImportJsonClick,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  const handleNameSave = () => {
    if (tempName.trim()) {
      onUpdateProjectName(tempName.trim());
    } else {
      setTempName(projectName);
    }
    setIsEditingName(false);
  };

  const hasShort = simulationState.diagnostics.shortCircuits.length > 0;
  const isRunning = simulationState.isRunning;

  return (
    <header className="h-14 bg-[#090C13] border-b border-[#232B3E] px-4 flex items-center justify-between z-30 select-none">
      {/* LEFT: Brand Logo & Project Title */}
      <div className="flex items-center gap-3">
        {/* Geometric CircuitForge Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenGallery} title="Open Projects & Examples">
          <svg width="28" height="28" viewBox="0 0 32 32" className="drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            <rect width="32" height="32" rx="6" fill="#0E131F" stroke="#232B3E" strokeWidth="1.5" />
            <path
              d="M7 16h4l2-6 4 12 2-6h6"
              stroke="#00F0FF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="7" cy="16" r="2.2" fill="#00F0FF" />
            <circle cx="25" cy="16" r="2.2" fill="#00F0FF" />
          </svg>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-slate-100 tracking-wider">
                CIRCUIT<span className="text-[#00F0FF]">FORGE</span>
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 bg-cyan-950/80 text-[#00F0FF] border border-cyan-500/30 rounded">
                v1.0
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-[#232B3E] hidden md:block" />

        {/* Project Title Editor */}
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-slate-300">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                className="bg-[#131720] border border-cyan-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleNameSave}
                className="p-1 text-[#00F0FF] hover:bg-[#1E293B] rounded"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setTempName(projectName);
                setIsEditingName(true);
              }}
              className="flex items-center gap-1.5 cursor-pointer hover:text-white px-2 py-1 rounded hover:bg-[#131720] transition-colors"
              title="Click to rename project"
            >
              <span className="font-semibold max-w-[200px] truncate">{projectName}</span>
              <Edit2 className="w-3 h-3 text-slate-500" />
            </div>
          )}
        </div>
      </div>

      {/* CENTER: Mode Switcher & Simulation Controls */}
      <div className="flex items-center gap-3">
        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center bg-[#131720] p-1 rounded-lg border border-[#232B3E]">
          <button
            onClick={() => onChangeMode('breadboard')}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'breadboard'
                ? 'bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Breadboard</span>
          </button>

          <button
            onClick={() => onChangeMode('schematic')}
            className={`px-3 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              activeMode === 'schematic'
                ? 'bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Schematic</span>
          </button>
        </div>

        {/* Simulation Execution Controls */}
        <div className="flex items-center bg-[#131720] px-2 py-1 rounded-lg border border-[#232B3E] gap-2">
          <button
            onClick={onToggleSimulation}
            className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
              isRunning
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
            }`}
            title={isRunning ? 'Pause Simulation' : 'Start Simulation'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">{isRunning ? 'PAUSE' : 'SIMULATE'}</span>
          </button>

          <button
            onClick={onResetSimulation}
            title="Reset Simulation State"
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1C2433] rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Telemetry power badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 bg-[#090C13] rounded border border-[#232B3E]">
            {hasShort ? (
              <span className="text-red-400 flex items-center gap-1 font-bold animate-pulse">
                <Flame className="w-3 h-3" />
                SHORT CIRCUIT
              </span>
            ) : isRunning ? (
              <span className="text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>P: {(simulationState.diagnostics.totalPower * 1000).toFixed(0)} mW</span>
              </span>
            ) : (
              <span className="text-slate-500">Standby</span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Gallery, Learning, Import/Export, Legal */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenGallery}
          title="Open Project Manager"
          className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-[#131720] border border-[#232B3E] rounded flex items-center gap-1.5 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#00F0FF]" />
          <span className="hidden md:inline">Projects</span>
        </button>

        <button
          onClick={onOpenLearning}
          title="Open Learning Center & Ohm's Law Calculator"
          className="px-2.5 py-1 text-xs font-mono text-slate-300 hover:text-white hover:bg-[#131720] border border-[#232B3E] rounded flex items-center gap-1.5 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Learn</span>
        </button>

        <div className="h-4 w-px bg-[#232B3E] mx-1 hidden sm:block" />

        <button
          onClick={onExportJson}
          title="Export Circuit as JSON"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#131720] rounded transition-colors hidden sm:block"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onImportJsonClick}
          title="Import Circuit JSON"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#131720] rounded transition-colors hidden sm:block"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#131720] rounded transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#232B3E] mx-1 hidden lg:block" />

        {/* Legal Links (Privacy & Terms) */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-500">
          <button
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-slate-300 px-1 py-0.5 rounded transition-colors"
          >
            Privacy
          </button>
          <span>/</span>
          <button
            onClick={() => onOpenLegal('terms')}
            className="hover:text-slate-300 px-1 py-0.5 rounded transition-colors"
          >
            Terms
          </button>
        </div>
      </div>
    </header>
  );
};
