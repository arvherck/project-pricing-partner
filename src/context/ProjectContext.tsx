import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProjectConfig, Resource, RateCard, Currency } from '@/lib/types';
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
  colaPercent: number;
  setColaPercent: (v: number) => void;
  bufferEnabled: boolean;
  setBufferEnabled: (v: boolean) => void;
  bufferPercent: number;
  setBufferPercent: (v: number) => void;
  targetCurrency: Currency;
  setTargetCurrency: (c: Currency) => void;
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
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate rateCard has current seniority keys; if not, discard it
      if (parsed?.rateCard && !parsed.rateCard['Junior Consultant']) {
        parsed.rateCard = null;
      }
      // Validate resources have current seniority values
      if (parsed?.resources) {
        const validSeniorities = ['Junior Consultant', 'Consultant', 'Senior Consultant', 'Manager', 'Sr. Manager', 'Managing Director/VP'];
        parsed.resources = parsed.resources.filter((r: any) => validSeniorities.includes(r.seniority));
      }
      return parsed;
    }
  } catch {}
  return null;
}

function saveState(state: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

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

  useEffect(() => {
    saveState({ config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent, targetCurrency });
  }, [config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent, targetCurrency]);

  return (
    <ProjectContext.Provider value={{
      config, setConfig, resources, setResources, rateCard, setRateCard,
      colaEnabled, setColaEnabled, colaPercent, setColaPercent,
      bufferEnabled, setBufferEnabled, bufferPercent, setBufferPercent,
      targetCurrency, setTargetCurrency,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
