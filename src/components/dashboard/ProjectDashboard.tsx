import React, { useState } from 'react';
import { ProjectData } from '../../types/circuit';
import {
  FolderOpen,
  Plus,
  Copy,
  Trash2,
  Calendar,
  Layers,
  Cpu,
  Search,
  Upload,
  CircuitBoard,
} from 'lucide-react';

interface ProjectDashboardProps {
  isOpen: boolean;
  projects: ProjectData[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onNewProject: (mode: 'breadboard' | 'schematic') => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onImportJsonClick: () => void;
  onClose: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  isOpen,
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onDuplicateProject,
  onDeleteProject,
  onImportJsonClick,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E131F] border border-[#232B3E] rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#232B3E] flex items-center justify-between bg-[#131720]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-500/10 text-[#00F0FF] border border-cyan-500/30">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Project Manager</h2>
              <p className="text-xs text-slate-400 font-sans">Manage your saved circuits, create new designs, or import project files.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded hover:bg-[#1E293B]"
          >
            ✕
          </button>
        </div>

        {/* Action bar */}
        <div className="px-6 py-3 border-b border-[#232B3E] bg-[#090C13] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Saved Circuits ({projects.length})</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search circuits..."
                className="bg-[#131720] border border-[#232B3E] rounded px-8 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00F0FF] w-48"
              />
            </div>

            {/* New Breadboard Project */}
            <button
              onClick={() => {
                onNewProject('breadboard');
                onClose();
              }}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Breadboard</span>
            </button>

            {/* New Schematic Project */}
            <button
              onClick={() => {
                onNewProject('schematic');
                onClose();
              }}
              className="px-3 py-1 bg-[#1C2433] hover:bg-[#232B3E] text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Schematic</span>
            </button>

            {/* Import JSON */}
            <button
              onClick={onImportJsonClick}
              title="Import Circuit JSON"
              className="p-1.5 bg-[#131720] hover:bg-[#1E293B] border border-[#232B3E] text-slate-300 rounded text-xs flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Project Grid / Empty State */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                return (
                  <div
                    key={proj.id}
                    className={`bg-[#131720] border rounded-lg p-4 transition-all flex flex-col justify-between ${
                      isActive ? 'border-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.15)]' : 'border-[#232B3E] hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                          }}
                          className="text-sm font-bold text-slate-100 hover:text-[#00F0FF] cursor-pointer transition-colors"
                        >
                          {proj.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                            {proj.activeMode === 'breadboard' ? <Layers className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                            {proj.activeMode.toUpperCase()}
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold">
                              CURRENT
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-sans leading-relaxed mb-3">
                        {proj.description || 'Custom circuit design'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                        </span>
                        <span>{proj.components.length} parts</span>
                        <span>{proj.wires.length} wires</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onDuplicateProject(proj.id)}
                          title="Duplicate Project"
                          className="p-1.5 text-slate-400 hover:text-[#00F0FF] hover:bg-[#1C2433] rounded transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {confirmDeleteId === proj.id ? (
                          <button
                            onClick={() => {
                              onDeleteProject(proj.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold"
                          >
                            Confirm Delete
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(proj.id)}
                            title="Delete Project"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-[#1C2433] rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                          }}
                          className="ml-2 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-500/40 rounded text-xs font-semibold"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Clean Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="p-4 rounded-xl bg-[#131720] border border-[#232B3E] mb-4 text-[#00F0FF]">
                <CircuitBoard className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-1">No Saved Circuits Yet</h3>
              <p className="text-xs text-slate-400 font-sans max-w-sm mb-6 leading-relaxed">
                Your dashboard is clean. Create a new circuit from scratch on the breadboard or schematic editor, or import an existing JSON file.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    onNewProject('breadboard');
                    onClose();
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Breadboard Circuit</span>
                </button>
                <button
                  onClick={() => {
                    onNewProject('schematic');
                    onClose();
                  }}
                  className="px-4 py-2 bg-[#1C2433] hover:bg-[#232B3E] text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Schematic Circuit</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
