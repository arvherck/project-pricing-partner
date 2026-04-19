import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { ProjectConfig, Resource, RateCard, Currency, Country, InvoiceRow, Scenario, RateCardTemplate } from '@/lib/types';
import { defaultRateCard } from '@/lib/rateCardDefaults';
import { useHistory } from '@/hooks/use-history';

interface SavedProject {
  id: string;
  name: string;
  data: any;
}

interface ProjectState {
  config: ProjectConfig;
  setConfig: (c: ProjectConfig) => void;
  resources: Resource[];
  setResources: (r: Resource[]) => void;
  rateCard: RateCard;
  setRateCard: (rc: RateCard) => void;
  colaEnabled: boolean;
  setColaEnabled: (v: boolean) => void;
  colaPercent: number;
  setColaPercent: (v: number) => void;
  bufferEnabled: boolean;
  setBufferEnabled: (v: boolean) => void;
  bufferPercent: number;
  setBufferPercent: (v: number) => void;
  targetCurrency: Currency;
  setTargetCurrency: (c: Currency) => void;
  programVacationWeeks: number[];
  setProgramVacationWeeks: (w: number[]) => void;
  visibleCountries: Country[];
  setVisibleCountries: (c: Country[]) => void;
  invoiceRows: InvoiceRow[];
  setInvoiceRows: (r: InvoiceRow[]) => void;
  customRates: Record<string, number | null>;
  setCustomRates: (r: Record<string, number | null>) => void;
  // Scenarios
  scenarios: Scenario[];
  setScenarios: (s: Scenario[]) => void;
  activeScenarioId: string;
  setActiveScenarioId: (id: string) => void;
  addScenario: (name: string) => void;
  removeScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  // Multi-project
  savedProjects: SavedProject[];
  currentProjectId: string | null;
  saveCurrentProject: () => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  newProject: () => void;
}

const STORAGE_KEY = 'pricing-calculator-state';
const PROJECTS_STORAGE_KEY = 'pricing-calculator-projects';
const STATE_VERSION = 8;

const ProjectContext = createContext<ProjectState | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?._version !== STATE_VERSION) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    }
  } catch {}
  return null;
}

function saveState(state: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _version: STATE_VERSION }));
}

function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveProjects(projects: SavedProject[]) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

const defaultScenario: Scenario = {
  id: crypto.randomUUID(),
  name: 'Base',
  resources: [],
  rateCard: defaultRateCard,
  colaEnabled: false,
  colaPercent: 2.5,
  bufferEnabled: false,
  bufferPercent: 10,
};

export function ProjectProvider({ children }: { children: ReactNode }) {
  const saved = loadState();

  const [config, setConfig] = useState<ProjectConfig>(saved?.config ?? { name: '', startDate: '', endDate: '' });
  const [resources, setResources] = useState<Resource[]>(saved?.resources ?? []);
  const [rateCard, setRateCard] = useState<RateCard>(saved?.rateCard ?? defaultRateCard);
  const [colaEnabled, setColaEnabled] = useState(saved?.colaEnabled ?? false);
  const [colaPercent, setColaPercent] = useState(saved?.colaPercent ?? 2.5);
  const [bufferEnabled, setBufferEnabled] = useState(saved?.bufferEnabled ?? false);
  const [bufferPercent, setBufferPercent] = useState(saved?.bufferPercent ?? 10);
  const [targetCurrency, setTargetCurrency] = useState<Currency>(saved?.targetCurrency ?? 'EUR');
  const [programVacationWeeks, setProgramVacationWeeks] = useState<number[]>(saved?.programVacationWeeks ?? []);
  const [visibleCountries, setVisibleCountries] = useState<Country[]>(saved?.visibleCountries ?? ['Netherlands', 'Sweden'] as Country[]);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>(saved?.invoiceRows ?? []);
  const [customRates, setCustomRates] = useState<Record<string, number | null>>(saved?.customRates ?? {});
  const [scenarios, setScenarios] = useState<Scenario[]>(saved?.scenarios ?? [{ ...defaultScenario, id: crypto.randomUUID() }]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(saved?.activeScenarioId ?? scenarios[0]?.id ?? '');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(loadProjects());
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(saved?.currentProjectId ?? null);

  // Sync active scenario with main state
  useEffect(() => {
    const active = scenarios.find(s => s.id === activeScenarioId);
    if (active) {
      setResources(active.resources);
      setRateCard(active.rateCard);
      setColaEnabled(active.colaEnabled);
      setColaPercent(active.colaPercent);
      setBufferEnabled(active.bufferEnabled);
      setBufferPercent(active.bufferPercent);
    }
  }, [activeScenarioId]);

  // Update current scenario when main state changes
  useEffect(() => {
    setScenarios(prev => prev.map(s =>
      s.id === activeScenarioId
        ? { ...s, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent }
        : s
    ));
  }, [resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent]);

  const addScenario = useCallback((name: string) => {
    const active = scenarios.find(s => s.id === activeScenarioId);
    const newScenario: Scenario = {
      id: crypto.randomUUID(),
      name,
      resources: active ? JSON.parse(JSON.stringify(active.resources)) : [],
      rateCard: active ? JSON.parse(JSON.stringify(active.rateCard)) : defaultRateCard,
      colaEnabled: active?.colaEnabled ?? false,
      colaPercent: active?.colaPercent ?? 2.5,
      bufferEnabled: active?.bufferEnabled ?? false,
      bufferPercent: active?.bufferPercent ?? 10,
    };
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioId(newScenario.id);
  }, [scenarios, activeScenarioId]);

  const removeScenario = useCallback((id: string) => {
    if (scenarios.length <= 1) return;
    const updated = scenarios.filter(s => s.id !== id);
    setScenarios(updated);
    if (activeScenarioId === id) {
      setActiveScenarioId(updated[0].id);
    }
  }, [scenarios, activeScenarioId]);

  const renameScenario = useCallback((id: string, name: string) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  }, []);

  const getFullState = () => ({
    config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent,
    targetCurrency, programVacationWeeks, visibleCountries, invoiceRows, customRates,
    scenarios, activeScenarioId, currentProjectId,
  });

  const saveCurrentProject = useCallback(() => {
    const state = getFullState();
    const name = config.name || 'Untitled Project';
    if (currentProjectId) {
      const updated = savedProjects.map(p =>
        p.id === currentProjectId ? { ...p, name, data: state } : p
      );
      setSavedProjects(updated);
      saveProjects(updated);
    } else {
      const id = crypto.randomUUID();
      const newProject: SavedProject = { id, name, data: state };
      const updated = [...savedProjects, newProject];
      setSavedProjects(updated);
      saveProjects(updated);
      setCurrentProjectId(id);
    }
  }, [config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent,
    targetCurrency, programVacationWeeks, visibleCountries, invoiceRows, customRates,
    scenarios, activeScenarioId, currentProjectId, savedProjects]);

  const loadProject = useCallback((id: string) => {
    const project = savedProjects.find(p => p.id === id);
    if (!project) return;
    const d = project.data;
    setConfig(d.config);
    setResources(d.resources);
    setRateCard(d.rateCard);
    setColaEnabled(d.colaEnabled);
    setColaPercent(d.colaPercent);
    setBufferEnabled(d.bufferEnabled);
    setBufferPercent(d.bufferPercent);
    setTargetCurrency(d.targetCurrency);
    setProgramVacationWeeks(d.programVacationWeeks);
    setVisibleCountries(d.visibleCountries);
    setInvoiceRows(d.invoiceRows);
    setCustomRates(d.customRates);
    setScenarios(d.scenarios ?? [{ ...defaultScenario, id: crypto.randomUUID() }]);
    setActiveScenarioId(d.activeScenarioId ?? d.scenarios?.[0]?.id ?? '');
    setCurrentProjectId(id);
  }, [savedProjects]);

  const deleteProject = useCallback((id: string) => {
    const updated = savedProjects.filter(p => p.id !== id);
    setSavedProjects(updated);
    saveProjects(updated);
    if (currentProjectId === id) setCurrentProjectId(null);
  }, [savedProjects, currentProjectId]);

  const newProject = useCallback(() => {
    setConfig({ name: '', startDate: '', endDate: '' });
    setResources([]);
    setRateCard(defaultRateCard);
    setColaEnabled(false);
    setColaPercent(2.5);
    setBufferEnabled(false);
    setBufferPercent(10);
    setTargetCurrency('EUR');
    setProgramVacationWeeks([]);
    setVisibleCountries(['Netherlands', 'Sweden'] as Country[]);
    setInvoiceRows([]);
    setCustomRates({});
    setScenarios([{ ...defaultScenario, id: crypto.randomUUID() }]);
    setActiveScenarioId('');
    setCurrentProjectId(null);
  }, []);

  useEffect(() => {
    saveState({
      config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent,
      targetCurrency, programVacationWeeks, visibleCountries, invoiceRows, customRates,
      scenarios, activeScenarioId, currentProjectId,
    });
  }, [config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent,
    targetCurrency, programVacationWeeks, visibleCountries, invoiceRows, customRates,
    scenarios, activeScenarioId, currentProjectId]);

  return (
    <ProjectContext.Provider value={{
      config, setConfig, resources, setResources, rateCard, setRateCard,
      colaEnabled, setColaEnabled, colaPercent, setColaPercent,
      bufferEnabled, setBufferEnabled, bufferPercent, setBufferPercent,
      targetCurrency, setTargetCurrency,
      programVacationWeeks, setProgramVacationWeeks,
      visibleCountries, setVisibleCountries,
      invoiceRows, setInvoiceRows,
      customRates, setCustomRates,
      scenarios, setScenarios, activeScenarioId, setActiveScenarioId,
      addScenario, removeScenario, renameScenario,
      savedProjects, currentProjectId, saveCurrentProject, loadProject, deleteProject, newProject,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
