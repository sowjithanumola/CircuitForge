import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ProjectData,
  CircuitComponent,
  Wire,
  WireColor,
  EditorMode,
  SimulationState,
} from './types/circuit';
import { createComponent } from './data/componentRegistry';
import { simulateCircuit } from './simulation/engine';
import {
  getSavedProjects,
  saveSingleProject,
  deleteProjectById,
  duplicateProjectById,
  getActiveProjectId,
  setActiveProjectId,
  validateAndImportProject,
} from './utils/storage';
import { downloadProjectJson } from './utils/export';
import { Navbar } from './components/common/Navbar';
import { ComponentSidebar } from './components/library/ComponentSidebar';
import { BreadboardCanvas } from './components/breadboard/BreadboardCanvas';
import { SchematicCanvas } from './components/schematic/SchematicCanvas';
import { InspectorPanel } from './components/inspector/InspectorPanel';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { LearningCenter } from './components/learning/LearningCenter';
import { LegalModal } from './components/common/LegalModals';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
const createBlankProject = (mode: EditorMode = 'breadboard'): ProjectData => ({
  id: `proj_${Date.now()}`,
  name: mode === 'breadboard' ? 'Untitled Breadboard' : 'Untitled Schematic',
  description: 'Blank circuit canvas',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  activeMode: mode,
  breadboardView: { x: 40, y: 30, zoom: 1 },
  schematicView: { x: 50, y: 50, zoom: 1 },
  components: [],
  wires: [],
});

export default function App() {
  // Load initial projects (starts empty if no user projects saved)
  const [projectsList, setProjectsList] = useState<ProjectData[]>(() => getSavedProjects());
  const [activeProjectId, setActiveId] = useState<string>(() => getActiveProjectId());

  // Active Project (blank canvas if no saved projects)
  const [project, setProject] = useState<ProjectData>(() => {
    const list = getSavedProjects();
    const active = list.find(p => p.id === getActiveProjectId()) || list[0];
    return active || createBlankProject('breadboard');
  });

  // Editor states
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [activeWireColor, setActiveWireColor] = useState<WireColor>('#EF4444');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Simulation state
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [simulationState, setSimulationState] = useState<SimulationState>(() =>
    simulateCircuit(project.components, project.wires, 0)
  );

  // Hidden file input for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Update simulation whenever components, wires, or run state changes
  useEffect(() => {
    if (isSimRunning) {
      const result = simulateCircuit(project.components, project.wires, simulationState.stepCount);
      setSimulationState({
        ...result,
        isRunning: true,
      });

      if (result.diagnostics.shortCircuits.length > 0) {
        addToast(`Short circuit alert: ${result.diagnostics.shortCircuits[0]}`, 'error');
      }
    } else {
      setSimulationState(prev => ({
        ...prev,
        isRunning: false,
      }));
    }
  }, [project.components, project.wires, isSimRunning]);

  // Periodic simulation tick for current flow animations & steady-state
  useEffect(() => {
    if (!isSimRunning) return;
    const interval = setInterval(() => {
      setSimulationState(prev => ({
        ...prev,
        stepCount: prev.stepCount + 1,
      }));
    }, 500);
    return () => clearInterval(interval);
  }, [isSimRunning]);

  // Autosave to localStorage on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveSingleProject(project);
    }, 1000);
    return () => clearTimeout(timer);
  }, [project]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        if (selectedComponentId) {
          e.preventDefault();
          handleRotateComponent(selectedComponentId);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId) {
          e.preventDefault();
          handleDeleteComponent(selectedComponentId);
        } else if (selectedWireId) {
          e.preventDefault();
          handleDeleteWire(selectedWireId);
        }
      } else if (e.key === 'Escape') {
        setSelectedComponentId(null);
        setSelectedWireId(null);
      } else if (e.key === '?') {
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, selectedWireId]);

  // Component manipulation handlers
  const handleAddComponent = (type: any) => {
    const defaultPos = { x: 340, y: 220 };
    const count = project.components.filter(c => c.type === type).length;
    const newComp = createComponent(type, defaultPos, count);

    setProject(prev => ({
      ...prev,
      components: [...prev.components, newComp],
      updatedAt: new Date().toISOString(),
    }));

    setSelectedComponentId(newComp.id);
    setSelectedWireId(null);
    addToast(`Added ${newComp.designator} to circuit canvas`, 'success');
  };

  const handleUpdateComponentPos = (id: string, pos: { x: number; y: number }) => {
    setProject(prev => ({
      ...prev,
      components: prev.components.map(comp => {
        if (comp.id !== id) return comp;
        return prev.activeMode === 'breadboard'
          ? { ...comp, breadboardPos: pos }
          : { ...comp, schematicPos: pos };
      }),
    }));
  };

  const handleRotateComponent = (id: string) => {
    setProject(prev => ({
      ...prev,
      components: prev.components.map(comp => {
        if (comp.id !== id) return comp;
        return { ...comp, rotation: (comp.rotation + 90) % 360 };
      }),
    }));
    addToast('Component rotated 90°', 'info');
  };

  const handleDeleteComponent = (id: string) => {
    setProject(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id),
      wires: prev.wires.filter(w => w.fromComponentId !== id && w.toComponentId !== id),
    }));
    setSelectedComponentId(null);
    addToast('Component removed', 'info');
  };

  const handleUpdateProperties = (id: string, properties: Partial<CircuitComponent['properties']>) => {
    setProject(prev => ({
      ...prev,
      components: prev.components.map(c => {
        if (c.id !== id) return c;
        return { ...c, properties: { ...c.properties, ...properties } };
      }),
    }));
  };

  const handleUpdateDesignator = (id: string, designator: string) => {
    setProject(prev => ({
      ...prev,
      components: prev.components.map(c => {
        if (c.id !== id) return c;
        return { ...c, designator };
      }),
    }));
  };

  // Wire manipulation handlers
  const handleAddWire = (wire: Wire) => {
    setProject(prev => ({
      ...prev,
      wires: [...prev.wires, wire],
    }));
    setSelectedWireId(wire.id);
    setSelectedComponentId(null);
    addToast('Jumper wire connected', 'success');
  };

  const handleDeleteWire = (wireId: string) => {
    setProject(prev => ({
      ...prev,
      wires: prev.wires.filter(w => w.id !== wireId),
    }));
    setSelectedWireId(null);
    addToast('Wire disconnected', 'info');
  };

  // Project management handlers
  const handleSelectProject = (id: string) => {
    const list = getSavedProjects();
    const found = list.find(p => p.id === id);
    if (found) {
      setProject(found);
      setActiveId(found.id);
      setActiveProjectId(found.id);
      setSelectedComponentId(null);
      setSelectedWireId(null);
      addToast(`Loaded ${found.name}`, 'success');
    }
  };

  const handleNewProject = (mode: EditorMode) => {
    const newProj: ProjectData = {
      id: `proj_${Date.now()}`,
      name: mode === 'breadboard' ? 'New Breadboard Circuit' : 'New Schematic Circuit',
      description: 'Custom circuit project',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeMode: mode,
      breadboardView: { x: 40, y: 30, zoom: 1 },
      schematicView: { x: 50, y: 50, zoom: 1 },
      components: [],
      wires: [],
    };
    saveSingleProject(newProj);
    setProjectsList(getSavedProjects());
    setProject(newProj);
    setActiveId(newProj.id);
    setSelectedComponentId(null);
    setSelectedWireId(null);
    addToast('Created new circuit workspace', 'success');
  };

  const handleDuplicateProject = (id: string) => {
    const copy = duplicateProjectById(id);
    if (copy) {
      setProjectsList(getSavedProjects());
      setProject(copy);
      setActiveId(copy.id);
      addToast(`Duplicated to ${copy.name}`, 'success');
    }
  };

  const handleDeleteProject = (id: string) => {
    const updated = deleteProjectById(id);
    setProjectsList(updated);
    if (updated.length > 0) {
      setProject(updated[0]);
      setActiveId(updated[0].id);
    } else {
      handleNewProject('breadboard');
    }
    addToast('Project deleted', 'info');
  };

  // Import JSON handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndImportProject(content);
      if (res.success && res.project) {
        setProjectsList(getSavedProjects());
        setProject(res.project);
        setActiveId(res.project.id);
        addToast(`Successfully imported ${res.project.name}`, 'success');
      } else {
        addToast(`Import failed: ${res.error}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const selectedComponent = project.components.find(c => c.id === selectedComponentId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090B10] text-slate-100 overflow-hidden select-none font-sans">
      {/* Hidden file input for JSON circuit imports */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* TOP NAVIGATION BAR */}
      <Navbar
        projectName={project.name}
        onUpdateProjectName={(name) => setProject(p => ({ ...p, name }))}
        activeMode={project.activeMode}
        onChangeMode={(mode) => setProject(p => ({ ...p, activeMode: mode }))}
        simulationState={simulationState}
        onToggleSimulation={() => setIsSimRunning(!isSimRunning)}
        onResetSimulation={() => {
          setIsSimRunning(true);
          setSimulationState(simulateCircuit(project.components, project.wires, 0));
          addToast('Simulation state reset', 'info');
        }}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenLearning={() => setIsLearningOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenLegal={(type) => setLegalModalType(type)}
        onExportJson={() => {
          downloadProjectJson(project);
          addToast('Circuit project exported as JSON', 'success');
        }}
        onImportJsonClick={() => fileInputRef.current?.click()}
      />

      {/* WORKSPACE MAIN BODY */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* COMPONENT LIBRARY SIDEBAR */}
        <ComponentSidebar
          onAddComponent={handleAddComponent}
          activeWireColor={activeWireColor}
          onChangeWireColor={(c) => setActiveWireColor(c)}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* RE-OPEN SIDEBAR BUTTON IF CLOSED */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 bg-[#131720] border border-[#232B3E] hover:border-[#00F0FF] text-xs font-mono px-3 py-1.5 rounded-lg text-slate-300 shadow-xl transition-all"
          >
            + Components
          </button>
        )}

        {/* ACTIVE CANVAS (BREADBOARD OR SCHEMATIC) */}
        <main className="flex-1 relative h-full">
          {project.activeMode === 'breadboard' ? (
            <BreadboardCanvas
              components={project.components}
              wires={project.wires}
              selectedComponentId={selectedComponentId}
              selectedWireId={selectedWireId}
              activeWireColor={activeWireColor}
              simulationState={simulationState}
              viewport={project.breadboardView}
              onSelectComponent={(id) => {
                setSelectedComponentId(id);
                if (id) setSelectedWireId(null);
              }}
              onSelectWire={(id) => {
                setSelectedWireId(id);
                if (id) setSelectedComponentId(null);
              }}
              onUpdateComponentPos={handleUpdateComponentPos}
              onRotateComponent={handleRotateComponent}
              onDeleteComponent={handleDeleteComponent}
              onAddWire={handleAddWire}
              onDeleteWire={handleDeleteWire}
              onUpdateViewport={(v) => setProject(p => ({ ...p, breadboardView: v }))}
            />
          ) : (
            <SchematicCanvas
              projectName={project.name}
              components={project.components}
              wires={project.wires}
              selectedComponentId={selectedComponentId}
              selectedWireId={selectedWireId}
              activeWireColor={activeWireColor}
              simulationState={simulationState}
              viewport={project.schematicView}
              onSelectComponent={(id) => {
                setSelectedComponentId(id);
                if (id) setSelectedWireId(null);
              }}
              onSelectWire={(id) => {
                setSelectedWireId(id);
                if (id) setSelectedComponentId(null);
              }}
              onUpdateComponentPos={handleUpdateComponentPos}
              onRotateComponent={handleRotateComponent}
              onDeleteComponent={handleDeleteComponent}
              onAddWire={handleAddWire}
              onDeleteWire={handleDeleteWire}
              onUpdateViewport={(v) => setProject(p => ({ ...p, schematicView: v }))}
            />
          )}
        </main>

        {/* RIGHT INSPECTOR PANEL */}
        <InspectorPanel
          component={selectedComponent}
          simResult={selectedComponentId ? simulationState.results[selectedComponentId] : undefined}
          isSimulating={simulationState.isRunning}
          onUpdateProperties={handleUpdateProperties}
          onUpdateDesignator={handleUpdateDesignator}
          onRotateComponent={handleRotateComponent}
          onDeleteComponent={handleDeleteComponent}
          onClose={() => setSelectedComponentId(null)}
        />
      </div>

      {/* FOOTER STATUS BAR */}
      <footer className="h-6 bg-[#07090D] border-t border-[#232B3E] px-4 flex items-center justify-between text-[10px] font-mono text-slate-500 z-30 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${simulationState.isRunning ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span>Engine: {simulationState.isRunning ? 'MNA Matrix Solver Running' : 'Idle'}</span>
          </span>
          <span>Components: {project.components.length}</span>
          <span>Wires: {project.wires.length}</span>
          <span>Nodes: {simulationState.diagnostics.nodeCount}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Autosaved locally</span>
          <span>•</span>
          <button onClick={() => setLegalModalType('privacy')} className="hover:text-slate-400">
            Privacy Policy
          </button>
          <span>•</span>
          <button onClick={() => setLegalModalType('terms')} className="hover:text-slate-400">
            Terms &amp; Conditions
          </button>
        </div>
      </footer>

      {/* MODALS */}
      <ProjectDashboard
        isOpen={isGalleryOpen}
        projects={projectsList}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDuplicateProject={handleDuplicateProject}
        onDeleteProject={handleDeleteProject}
        onImportJsonClick={() => {
          setIsGalleryOpen(false);
          fileInputRef.current?.click();
        }}
        onClose={() => setIsGalleryOpen(false)}
      />

      <LearningCenter
        isOpen={isLearningOpen}
        onClose={() => setIsLearningOpen(false)}
        onLoadChallengeProject={(challengeProj) => {
          saveSingleProject(challengeProj);
          setProjectsList(getSavedProjects());
          setProject(challengeProj);
          setActiveId(challengeProj.id);
          addToast(`Loaded ${challengeProj.name}`, 'success');
        }}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />
    </div>
  );
}
