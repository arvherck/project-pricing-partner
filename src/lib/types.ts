export type Seniority = 'Junior' | 'Mid' | 'Senior' | 'Principal' | 'Partner';
export type Country = 'Netherlands' | 'Belgium' | 'Germany' | 'UK' | 'Sweden' | 'USA';

export const SENIORITY_LEVELS: Seniority[] = ['Junior', 'Mid', 'Senior', 'Principal', 'Partner'];
export const COUNTRIES: Country[] = ['Netherlands', 'Belgium', 'Germany', 'UK', 'Sweden', 'USA'];

export type RateCard = Record<Seniority, Record<Country, number>>;

export interface Resource {
  id: string;
  name: string;
  seniority: Seniority;
  country: Country;
  allocationPercent: number;
  vacationWeeks: number[]; // week indices (0-based)
}

export interface ProjectConfig {
  name: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
}

export interface ProjectWeek {
  index: number;
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface ResourceCalculation {
  resourceId: string;
  weeklyBreakdown: { week: number; billableDays: number; price: number }[];
  totalWorkingDays: number;
  totalPrice: number;
}
