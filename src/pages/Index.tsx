import React, { useMemo, useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { Moon, Sun, Save, FilePlus, Trash2, ChevronDown, ChevronRight, BarChart3, Pencil, Undo2, Redo2 } from 'lucide-react';
import { ProjectProvider, useProject } from '@/context/ProjectContext';
import ProjectSetup from '@/components/ProjectSetup';
import RateCardEditor from '@/components/RateCardEditor';
import ResourceManager from '@/components/ResourceManager';
import WeeklyBreakdown from '@/components/WeeklyBreakdown';
import PriceAdjustments from '@/components/PriceAdjustments';
import SummaryView from '@/components/SummaryView';
import HolidayDisplay from '@/components/HolidayDisplay';
import InvoicingSchedule from '@/components/InvoicingSchedule';
import ScenarioCompare from '@/components/ScenarioCompare';
import UtilizationChart from '@/components/UtilizationChart';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { fetchECBRates, mergeRates, convertCurrency } from '@/lib/currencyRates';
import { COUNTRY_CURRENCY } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const THEME_KEY = 'pricing-calculator-theme';

function CollapsibleSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full text-left text-lg font-semibold hover:text-primary transition-colors py-1 group">
        {open ? <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" /> : <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />}
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function PricingCalculator() {
  const {
    config, resources, rateCard, programVacationWeeks, targetCurrency, customRates,
    scenarios, activeScenarioId, setActiveScenarioId, addScenario, removeScenario, renameScenario,
    savedProjects, currentProjectId, saveCurrentProject, loadProject, deleteProject, newProject,
    undo, redo, canUndo, canRedo,
  } = useProject();

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const [rates, setRates] = useState<Record<string, number>>({});
  useEffect(() => { fetchECBRates().then(r => setRates(r)); }, []);
  const finalRates = useMemo(() => mergeRates(rates, customRates), [rates, customRates]);

  const grandTotal = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return resources.reduce((sum, r) => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      const localCurrency = COUNTRY_CURRENCY[r.country];
      return sum + convertCurrency(calc.totalPrice, localCurrency, targetCurrency, finalRates);
    }, 0);
  }, [resources, weeks, rateCard, startDate, endDate, programVacationWeeks, targetCurrency, finalRates]);

  // Dark mode
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z or Ctrl+Y = redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Scenario editing
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editingScenarioName, setEditingScenarioName] = useState('');
  const [showCompare, setShowCompare] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
        <div className="container mx-auto flex items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Project Pricing Calculator</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Consulting project cost estimation</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Project management */}
            {savedProjects.length > 0 && (
              <Select value={currentProjectId ?? ''} onValueChange={id => loadProject(id)}>
                <SelectTrigger className="h-9 w-48 text-sm">
                  <SelectValue placeholder="Load project…" />
                </SelectTrigger>
                <SelectContent>
                  {savedProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={undo} disabled={!canUndo}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={redo} disabled={!canRedo}>
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={saveCurrentProject}>
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save project</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" onClick={newProject}>
                    <FilePlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New project</TooltipContent>
              </Tooltip>
              {currentProjectId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9 text-destructive" onClick={() => deleteProject(currentProjectId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete project</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setDark(!dark)}>
                    {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{dark ? 'Light mode' : 'Dark mode'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* Scenario tabs */}
      {scenarios.length > 0 && (
        <div className="container mx-auto px-6 pt-4">
          <div className="flex items-center gap-2">
            <Tabs value={activeScenarioId} onValueChange={setActiveScenarioId} className="flex-1">
              <TabsList className="h-9">
                {scenarios.map(s => (
                  <TabsTrigger key={s.id} value={s.id} className="text-sm px-4 gap-1.5"
                    onDoubleClick={() => { setEditingScenarioId(s.id); setEditingScenarioName(s.name); }}>
                    {editingScenarioId === s.id ? (
                      <Input
                        autoFocus
                        value={editingScenarioName}
                        onChange={e => setEditingScenarioName(e.target.value)}
                        onBlur={() => { renameScenario(s.id, editingScenarioName); setEditingScenarioId(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') { renameScenario(s.id, editingScenarioName); setEditingScenarioId(null); } if (e.key === 'Escape') setEditingScenarioId(null); }}
                        className="h-6 w-24 text-xs px-1"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        {s.name}
                        {activeScenarioId === s.id && (
                          <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingScenarioId(s.id); setEditingScenarioName(s.name); }} />
                        )}
                      </>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => addScenario(`Scenario ${scenarios.length + 1}`)}>
              + Scenario
            </Button>
            {scenarios.length > 1 && (
              <>
                <Button variant="outline" size="sm" className="h-9 text-xs text-destructive" onClick={() => removeScenario(activeScenarioId)}>
                  Remove
                </Button>
                <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setShowCompare(true)}>
                  <BarChart3 className="mr-1 h-3 w-3" /> Compare
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <main className="container mx-auto space-y-6 px-6 py-8">
        <CollapsibleSection title="Project Setup">
          <ProjectSetup />
        </CollapsibleSection>
        <CollapsibleSection title="Rate Card">
          <RateCardEditor />
        </CollapsibleSection>
        <CollapsibleSection title="Resources">
          <ResourceManager />
        </CollapsibleSection>
        <CollapsibleSection title="Resource Utilization" defaultOpen={false}>
          <UtilizationChart />
        </CollapsibleSection>
        <CollapsibleSection title="Weekly Breakdown" defaultOpen={false}>
          <WeeklyBreakdown />
        </CollapsibleSection>
        <CollapsibleSection title="Public Holidays" defaultOpen={false}>
          <HolidayDisplay />
        </CollapsibleSection>
        <CollapsibleSection title="Price Adjustments">
          <PriceAdjustments grandTotal={grandTotal} />
        </CollapsibleSection>
        <CollapsibleSection title="Summary">
          <SummaryView />
        </CollapsibleSection>
        <CollapsibleSection title="Invoicing Schedule">
          <InvoicingSchedule />
        </CollapsibleSection>
      </main>

      {showCompare && <ScenarioCompare onClose={() => setShowCompare(false)} />}
    </div>
  );
}

export default function Index() {
  return (
    <ProjectProvider>
      <PricingCalculator />
    </ProjectProvider>
  );
}
