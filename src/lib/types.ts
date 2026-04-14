export type Seniority = 'Junior Consultant' | 'Consultant' | 'Senior Consultant' | 'Manager' | 'Sr. Manager' | 'Managing Director/VP';
export type Country = 'Netherlands' | 'Belgium' | 'Germany' | 'UK' | 'Sweden' | 'USA';

export const SENIORITY_LEVELS: Seniority[] = ['Junior Consultant', 'Consultant', 'Senior Consultant', 'Manager', 'Sr. Manager', 'Managing Director/VP'];
export const COUNTRIES: Country[] = ['Netherlands', 'Belgium', 'Germany', 'UK', 'Sweden', 'USA'];

export const SENIORITY_EXPERIENCE: Record<Seniority, string> = {
  'Junior Consultant': '0-23 months',
  'Consultant': '24-47 months',
  'Senior Consultant': '48-71 months',
  'Manager': '72-107 months',
  'Sr. Manager': '108-179 months',
  'Managing Director/VP': '180+ months',
};

export type Currency = 'EUR' | 'GBP' | 'SEK' | 'USD';

export const COUNTRY_CURRENCY: Record<Country, Currency> = {
  Netherlands: 'EUR',
  Belgium: 'EUR',
  Germany: 'EUR',
  UK: 'GBP',
  Sweden: 'SEK',
  USA: 'USD',
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  SEK: 'kr',
  USD: '$',
};

export const ALL_CURRENCIES: Currency[] = ['EUR', 'GBP', 'SEK', 'USD'];

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
