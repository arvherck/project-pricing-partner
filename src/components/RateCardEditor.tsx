import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { SENIORITY_LEVELS, COUNTRIES, SENIORITY_EXPERIENCE, COUNTRY_CURRENCY, CURRENCY_SYMBOLS, COUNTRY_FLAGS, Seniority, Country } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Eye, BookmarkPlus, FolderOpen, X } from 'lucide-react';
import { toast } from 'sonner';

export default function RateCardEditor() {
  const { rateCard, setRateCard, visibleCountries, setVisibleCountries,
    rateTemplates, saveRateTemplate, loadRateTemplate, deleteRateTemplate } = useProject();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const updateRate = (seniority: Seniority, country: Country, value: string) => {
    const num = parseFloat(value) || 0;
    setRateCard({
      ...rateCard,
      [seniority]: { ...rateCard[seniority], [country]: num },
    });
  };

  const toggleCountry = (country: Country) => {
    setVisibleCountries(
      visibleCountries.includes(country)
        ? visibleCountries.filter(c => c !== country)
        : [...visibleCountries, country]
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle>Rate Card (per hour, local currency)</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderOpen className="mr-1 h-4 w-4" /> Load Template ({rateTemplates.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 max-h-72 overflow-y-auto p-2" align="end">
              {rateTemplates.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">No templates saved yet.</p>
              ) : (
                rateTemplates.map(t => (
                  <div key={t.id} className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-accent rounded group">
                    <button
                      className="flex-1 text-left truncate"
                      onClick={() => { loadRateTemplate(t.id); toast.success(`Loaded "${t.name}"`); }}
                    >
                      {t.name}
                    </button>
                    <button
                      className="opacity-50 hover:opacity-100 hover:text-destructive"
                      onClick={() => { deleteRateTemplate(t.id); toast.success(`Deleted "${t.name}"`); }}
                      aria-label="Delete template"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={() => { setTemplateName(''); setSaveDialogOpen(true); }}>
            <BookmarkPlus className="mr-1 h-4 w-4" /> Save as Template
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="mr-1 h-4 w-4" /> Countries ({visibleCountries.length}/{COUNTRIES.length})
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 max-h-72 overflow-y-auto p-2" align="end">
              {COUNTRIES.map(c => (
                <label key={c} className="flex items-center gap-2 px-2 py-1 text-xs cursor-pointer hover:bg-accent rounded">
                  <Checkbox checked={visibleCountries.includes(c)} onCheckedChange={() => toggleCountry(c)} />
                  <span>{COUNTRY_FLAGS[c]} {c}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Rate Card as Template</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="e.g. 2025 EU Rates"
            value={templateName}
            onChange={e => setTemplateName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && templateName.trim()) {
                saveRateTemplate(templateName.trim());
                toast.success(`Saved template "${templateName.trim()}"`);
                setSaveDialogOpen(false);
              }
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!templateName.trim()}
              onClick={() => {
                saveRateTemplate(templateName.trim());
                toast.success(`Saved template "${templateName.trim()}"`);
                setSaveDialogOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
              {COUNTRIES.filter(c => visibleCountries.includes(c)).map(c => {
                const currency = COUNTRY_CURRENCY[c];
                const symbol = CURRENCY_SYMBOLS[currency];
                return (
                  <TableRow key={c}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 whitespace-nowrap">
                      <span className="mr-2">{COUNTRY_FLAGS[c]}</span>
                      {c}
                      <span className="ml-1 text-xs text-muted-foreground">({symbol}/hr)</span>
                    </TableCell>
                    {SENIORITY_LEVELS.map(s => (
                      <TableCell key={s} className="p-1">
                        <Input
                          type="number"
                          step="0.01"
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
