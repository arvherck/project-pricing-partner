import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProjectConfig, Resource, RateCard, Seniority, Country } from '@/lib/types';
import { defaultRateCard } from '@/lib/rateCardDefaults';

interface ProjectState {
  config: ProjectConfig;
  setConfig: (c: ProjectConfig) => void;
  resources: Resource[];
  setResources: (r: Resource[]) => void;
  rateCard: RateCard;
  setRateCard: (rc: RateCard) => void;
  colaEnabled: boolean;
  setColaEnabled: (v: boolean) => void;
  bufferEnabled: boolean;
  setBufferEnabled: (v: boolean) => void;
}

const STORAGE_KEY = 'pricing-calculator-state';

const ProjectContext = createContext<ProjectState | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(state: { config: ProjectConfig; resources: Resource[]; rateCard: RateCard; colaEnabled: boolean; bufferEnabled: boolean }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const saved = loadState();

  const [config, setConfig] = useState<ProjectConfig>(saved?.config ?? { name: '', startDate: '', endDate: '' });
  const [resources, setResources] = useState<Resource[]>(saved?.resources ?? []);
  const [rateCard, setRateCard] = useState<RateCard>(saved?.rateCard ?? defaultRateCard);
  const [colaEnabled, setColaEnabled] = useState(saved?.colaEnabled ?? false);
  const [bufferEnabled, setBufferEnabled] = useState(saved?.bufferEnabled ?? false);

  useEffect(() => {
    saveState({ config, resources, rateCard, colaEnabled, bufferEnabled });
  }, [config, resources, rateCard, colaEnabled, bufferEnabled]);

  return (
    <ProjectContext.Provider value={{ config, setConfig, resources, setResources, rateCard, setRateCard, colaEnabled, setColaEnabled, bufferEnabled, setBufferEnabled }}>
      {children}
    </ProjectContext.Provider>
  );
}
