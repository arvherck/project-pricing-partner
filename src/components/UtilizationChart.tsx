import React, { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { useProject } from '@/context/ProjectContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProjectWeeks, calculateResource } from '@/lib/calculations';
import { COUNTRY_FLAGS } from '@/lib/types';
import { cn } from '@/lib/utils';

function cellClass(pct: number): string {
  if (pct <= 0) return 'bg-muted/40';
  if (pct > 100) return 'bg-destructive/80 text-destructive-foreground';
  if (pct >= 80) return 'bg-primary text-primary-foreground';
  if (pct >= 50) return 'bg-primary/70 text-primary-foreground';
  if (pct >= 25) return 'bg-primary/40';
  return 'bg-primary/20';
}

export default function UtilizationChart() {
  const { config, resources, rateCard, programVacationWeeks } = useProject();
  const startDate = config.startDate ? parseISO(config.startDate) : null;
  const endDate = config.endDate ? parseISO(config.endDate) : null;
  const weeks = useMemo(
    () => (startDate && endDate ? getProjectWeeks(startDate, endDate) : []),
    [startDate, endDate],
  );

  const data = useMemo(() => {
    if (!startDate || !endDate || weeks.length === 0) return [];
    return resources.map((r) => {
      const calc = calculateResource(r, weeks, rateCard, startDate, endDate, programVacationWeeks);
      const cells = weeks.map((w) => {
        const wk = calc.weeklyBreakdown.find((b) => b.week === w.index);
        // Effective allocation % for the week vs a full 5-day week at 100%
        const billableDays = wk?.billableDays ?? 0;
        const pct = (billableDays / 5) * 100;
        const isProgramVac = programVacationWeeks.includes(w.index);
        return { weekIndex: w.index, label: w.label, pct, billableDays, isProgramVac };
      });
      return { resource: r, cells };
    });
  }, [resources, weeks, rateCard, startDate, endDate, programVacationWeeks]);

  const combined = useMemo(() => {
    return weeks.map((w) => {
      const total = data.reduce((sum, row) => {
        const cell = row.cells.find((c) => c.weekIndex === w.index);
        return sum + (cell?.pct ?? 0);
      }, 0);
      return { weekIndex: w.index, label: w.label, pct: total };
    });
  }, [data, weeks]);

  if (!startDate || !endDate) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Set project start and end dates to see utilization.
        </CardContent>
      </Card>
    );
  }
  if (resources.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Add resources to see utilization.
        </CardContent>
      </Card>
    );
  }

  const colWidth = 'minmax(40px, 1fr)';
  const gridTemplate = `220px repeat(${weeks.length}, ${colWidth})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={150}>
          <div className="overflow-x-auto">
            <div className="min-w-fit space-y-1">
              {/* Header */}
              <div className="grid gap-0.5" style={{ gridTemplateColumns: gridTemplate }}>
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 sticky left-0 bg-card z-10">Resource</div>
                {weeks.map((w) => (
                  <div key={w.index} className="text-[10px] text-center text-muted-foreground py-1 truncate" title={w.label}>
                    W{w.index + 1}
                  </div>
                ))}
              </div>

              {/* Combined load */}
              <div className="grid gap-0.5 items-center" style={{ gridTemplateColumns: gridTemplate }}>
                <div className="text-xs font-semibold px-2 py-1.5 sticky left-0 bg-card z-10">Combined load</div>
                {combined.map((c) => (
                  <Tooltip key={c.weekIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'h-7 rounded-sm flex items-center justify-center text-[10px] font-medium cursor-default',
                          cellClass(c.pct),
                        )}
                      >
                        {c.pct > 0 ? `${Math.round(c.pct)}%` : ''}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <div className="font-medium">{c.label}</div>
                        <div>Combined: {c.pct.toFixed(1)}%</div>
                        {c.pct > 100 && <div className="text-destructive">Over-allocated</div>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <div className="h-px bg-border my-1" />

              {/* Per-resource rows */}
              {data.map(({ resource, cells }) => (
                <div key={resource.id} className="grid gap-0.5 items-center" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="text-xs px-2 py-1 sticky left-0 bg-card z-10 truncate flex items-center gap-1.5">
                    <span>{COUNTRY_FLAGS[resource.country]}</span>
                    <span className="truncate" title={resource.name}>{resource.name || 'Unnamed'}</span>
                    <span className="text-muted-foreground text-[10px]">({resource.allocationPercent}%)</span>
                  </div>
                  {cells.map((c) => (
                    <Tooltip key={c.weekIndex}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            'h-7 rounded-sm flex items-center justify-center text-[10px] cursor-default',
                            cellClass(c.pct),
                            c.isProgramVac && 'opacity-40',
                          )}
                        >
                          {c.pct > 0 ? `${Math.round(c.pct)}` : ''}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="font-medium">{c.label}</div>
                          <div>{resource.name || 'Unnamed'}</div>
                          <div>Allocation: {c.pct.toFixed(1)}%</div>
                          <div>Billable days: {c.billableDays.toFixed(2)}</div>
                          {c.isProgramVac && <div className="text-muted-foreground">Program vacation week</div>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-3 pt-3 text-[10px] text-muted-foreground">
                <span>Legend:</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-muted/40" /> 0%</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-primary/20" /> &lt;25%</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-primary/40" /> 25-50%</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-primary/70" /> 50-80%</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-primary" /> 80-100%</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-destructive/80" /> &gt;100%</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
