import React from 'react';
import { useProject } from '@/context/ProjectContext';
import { SENIORITY_LEVELS, COUNTRIES, SENIORITY_EXPERIENCE, COUNTRY_CURRENCY, CURRENCY_SYMBOLS, COUNTRY_FLAGS, Seniority, Country } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function RateCardEditor() {
  const { rateCard, setRateCard } = useProject();

  const updateRate = (seniority: Seniority, country: Country, value: string) => {
    const num = parseInt(value) || 0;
    setRateCard({
      ...rateCard,
      [seniority]: { ...rateCard[seniority], [country]: num },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Card (per day, local currency)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44 sticky left-0 bg-card z-10">Country</TableHead>
                {SENIORITY_LEVELS.map(s => (
                  <TableHead key={s} className="text-center min-w-[100px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left">
                          <span className="text-xs">{s}</span>
                        </TooltipTrigger>
                        <TooltipContent>{SENIORITY_EXPERIENCE[s]} experience</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {COUNTRIES.map(c => {
                const currency = COUNTRY_CURRENCY[c];
                const symbol = CURRENCY_SYMBOLS[currency];
                return (
                  <TableRow key={c}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                      <span className="mr-2">{COUNTRY_FLAGS[c]}</span>
                      {c}
                      <span className="ml-1 text-xs text-muted-foreground">({symbol})</span>
                    </TableCell>
                    {SENIORITY_LEVELS.map(s => (
                      <TableCell key={s} className="p-1">
                        <Input
                          type="number"
                          className="h-8 text-center text-sm w-24"
                          value={rateCard[s]?.[c] ?? 0}
                          onChange={e => updateRate(s, c, e.target.value)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
