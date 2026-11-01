import { ProjectData } from '../types/circuit';

const STORAGE_KEY = 'circuitforge_user_projects_v2';
const ACTIVE_PROJECT_KEY = 'circuitforge_active_id_v2';

export function getSavedProjects(): ProjectData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to load projects from localStorage:', err);
    return [];
  }
}

export function saveAllProjects(projects: ProjectData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage:', err);
  }
}

export function saveSingleProject(project: ProjectData): void {
  const current = getSavedProjects();
  const existingIdx = current.findIndex(p => p.id === project.id);
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  let updatedList: ProjectData[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = updatedProject;
  } else {
    updatedList = [updatedProject, ...current];
  }

  saveAllProjects(updatedList);
  setActiveProjectId(project.id);
}

export function deleteProjectById(id: string): ProjectData[] {
  const current = getSavedProjects();
  const updated = current.filter(p => p.id !== id);
  saveAllProjects(updated);
  return updated;
}

export function duplicateProjectById(id: string): ProjectData | null {
  const current = getSavedProjects();
  const original = current.find(p => p.id === id);
  if (!original) return null;

  const copy: ProjectData = {
    ...JSON.parse(JSON.stringify(original)),
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: `${original.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [copy, ...current];
  saveAllProjects(updated);
  return copy;
}

export function getActiveProjectId(): string {
  return localStorage.getItem(ACTIVE_PROJECT_KEY) || '';
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function validateAndImportProject(jsonStr: string): {
  success: boolean;
  project?: ProjectData;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid JSON format: root is not an object.' };
    }
    if (!Array.isArray(data.components)) {
      return { success: false, error: 'Invalid project: components array is missing.' };
    }
    if (!Array.isArray(data.wires)) {
      return { success: false, error: 'Invalid project: wires array is missing.' };
    }

    const importedProject: ProjectData = {
      id: `proj_import_${Date.now()}`,
      name: (data.name && typeof data.name === 'string') ? `${data.name} (Imported)` : 'Imported Project',
      description: data.description || 'Imported CircuitForge project',
      version: data.version || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeMode: (data.activeMode === 'schematic' || data.activeMode === 'breadboard') ? data.activeMode : 'breadboard',
      components: data.components,
      wires: data.wires,
      breadboardView: data.breadboardView || { x: 40, y: 30, zoom: 1 },
      schematicView: data.schematicView || { x: 50, y: 50, zoom: 1 },
    };

    saveSingleProject(importedProject);
    return { success: true, project: importedProject };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse JSON file.' };
  }
}
