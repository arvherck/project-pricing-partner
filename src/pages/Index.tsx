import React, { useMemo, useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { ProjectProvider, useProject } from '@/context/ProjectContext';
import ProjectSetup from '@/components/ProjectSetup';
import RateCardEditor from '@/components/RateCardEditor';
import ResourceManager from '@/components/ResourceManager';
import WeeklyBreakdown from '@/components/WeeklyBreakdown';
import PriceAdjustments from '@/components/PriceAdjustments';
import SummaryView from '@/components/SummaryView';
import HolidayDisplay from '@/components/HolidayDisplay';
import InvoicingSchedule from '@/components/InvoicingSchedule';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { fetchECBRates, mergeRates, convertCurrency } from '@/lib/currencyRates';
import { COUNTRY_CURRENCY } from '@/lib/types';

function PricingCalculator() {
  const { config, resources, rateCard, programVacationWeeks, targetCurrency, customRates } = useProject();

  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = startDate && endDate ? getProjectWeeks(startDate, endDate) : [];

  const [rates, setRates] = useState<Record<string, number>>({});
  useEffect(() => {
    fetchECBRates().then(r => setRates(r));
  }, []);

  const finalRates = useMemo(() => mergeRates(rates, customRates), [rates, customRates]);

  const grandTotal = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return resources.reduce((sum, r) => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      const localCurrency = COUNTRY_CURRENCY[r.country];
      return sum + convertCurrency(calc.totalPrice, localCurrency, targetCurrency, finalRates);
    }, 0);
  }, [resources, weeks, rateCard, startDate, endDate, programVacationWeeks, targetCurrency, finalRates]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Project Pricing Calculator</h1>
            <p className="text-sm text-muted-foreground">Consulting project cost estimation</p>
          </div>
        </div>
      </header>
      <main className="container mx-auto space-y-6 px-4 py-6">
        <ProjectSetup />
        <RateCardEditor />
        <ResourceManager />
        <WeeklyBreakdown />
        <HolidayDisplay />
        <PriceAdjustments grandTotal={grandTotal} />
        <SummaryView />
        <InvoicingSchedule />
      </main>
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
