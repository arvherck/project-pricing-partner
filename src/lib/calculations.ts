import { startOfWeek, endOfWeek, eachWeekOfInterval, format, differenceInCalendarWeeks, eachDayOfInterval, isWeekend } from 'date-fns';
import { Resource, RateCard, ProjectWeek, ResourceCalculation } from './types';
import { getHolidaysInRange, isHoliday } from './holidays';

export function getProjectWeeks(start: Date, end: Date): ProjectWeek[] {
  if (!start || !end || start >= end) return [];
  const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  return weekStarts.map((ws, i) => {
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    const actualEnd = we > end ? end : we;
    return {
      index: i,
      startDate: ws < start ? start : ws,
      endDate: actualEnd,
      label: `W${i + 1}: ${format(ws < start ? start : ws, 'dd MMM')} – ${format(actualEnd, 'dd MMM')}`,
    };
  });
}

export function getTotalWeeks(start: Date, end: Date): number {
  if (!start || !end || start >= end) return 0;
  return differenceInCalendarWeeks(end, start, { weekStartsOn: 1 }) + 1;
}

export function calculateResource(
  resource: Resource,
  weeks: ProjectWeek[],
  rateCard: RateCard,
  projectStart: Date,
  projectEnd: Date,
  programVacationWeeks: number[] = [],
): ResourceCalculation {
  const dailyRate = rateCard[resource.seniority]?.[resource.country] ?? 0;
  const holidays = getHolidaysInRange(resource.country, projectStart, projectEnd);
  const allocation = resource.allocationPercent / 100;

  // Merge program-level and resource-level vacation weeks
  const allVacationWeeks = new Set([...resource.vacationWeeks, ...programVacationWeeks]);

  const weeklyBreakdown = weeks.map((week) => {
    if (allVacationWeeks.has(week.index)) {
      return { week: week.index, billableDays: 0, price: 0 };
    }

    const days = eachDayOfInterval({ start: week.startDate, end: week.endDate });
    const workingDays = days.filter(d => !isWeekend(d) && !isHoliday(d, holidays));
    const billableDays = workingDays.length * allocation;
    const price = billableDays * dailyRate;

    return { week: week.index, billableDays, price };
  });

  const totalWorkingDays = weeklyBreakdown.reduce((s, w) => s + w.billableDays, 0);
  const totalPrice = weeklyBreakdown.reduce((s, w) => s + w.price, 0);

  return { resourceId: resource.id, weeklyBreakdown, totalWorkingDays, totalPrice };
}
