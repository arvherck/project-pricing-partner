import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ProjectConfig, Resource, RateCard, Currency, Country, COUNTRIES, InvoiceRow } from '@/lib/types';
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
  programVacationWeeks: number[];
  setProgramVacationWeeks: (w: number[]) => void;
  visibleCountries: Country[];
  setVisibleCountries: (c: Country[]) => void;
  invoiceRows: InvoiceRow[];
  setInvoiceRows: (r: InvoiceRow[]) => void;
  customRates: Record<string, number | null>;
  setCustomRates: (r: Record<string, number | null>) => void;
}

const STORAGE_KEY = 'pricing-calculator-state';
const STATE_VERSION = 7;

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

  useEffect(() => {
    saveState({ config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent, targetCurrency, programVacationWeeks, visibleCountries, invoiceRows, customRates });
  }, [config, resources, rateCard, colaEnabled, colaPercent, bufferEnabled, bufferPercent, targetCurrency, programVacationWeeks, visibleCountries, invoiceRows, customRates]);

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
    }}>
      {children}
    </ProjectContext.Provider>
  );
}
