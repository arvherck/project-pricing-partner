import { RateCard } from './types';

// Rates are in local currency per country
export const defaultRateCard: RateCard = {
  'Junior Consultant':     { Netherlands: 650,  Belgium: 600,  Germany: 700,  UK: 550,  Sweden: 7000,  Denmark: 5000, Switzerland: 900,  France: 650,  Italy: 550,  Spain: 500,  Portugal: 450,  Poland: 2500, Russia: 50000, USA: 800,  Canada: 900,  Mexico: 12000, India: 35000, China: 4000 },
  'Consultant':            { Netherlands: 900,  Belgium: 850,  Germany: 950,  UK: 750,  Sweden: 9500,  Denmark: 7000, Switzerland: 1200, France: 900,  Italy: 800,  Spain: 700,  Portugal: 650,  Poland: 3500, Russia: 70000, USA: 1100, Canada: 1250, Mexico: 16000, India: 50000, China: 5500 },
  'Senior Consultant':     { Netherlands: 1200, Belgium: 1150, Germany: 1250, UK: 1000, Sweden: 12500, Denmark: 9000, Switzerland: 1600, France: 1200, Italy: 1050, Spain: 950,  Portugal: 850,  Poland: 4500, Russia: 90000, USA: 1450, Canada: 1650, Mexico: 22000, India: 70000, China: 7500 },
  'Manager':               { Netherlands: 1500, Belgium: 1450, Germany: 1550, UK: 1250, Sweden: 15500, Denmark: 11500,Switzerland: 2000, France: 1500, Italy: 1300, Spain: 1200, Portugal: 1050, Poland: 5500, Russia: 110000,USA: 1800, Canada: 2000, Mexico: 28000, India: 90000, China: 9500 },
  'Sr. Manager':           { Netherlands: 1800, Belgium: 1750, Germany: 1900, UK: 1500, Sweden: 19000, Denmark: 14000,Switzerland: 2500, France: 1800, Italy: 1600, Spain: 1450, Portugal: 1300, Poland: 7000, Russia: 140000,USA: 2200, Canada: 2500, Mexico: 35000, India: 115000,China: 12000 },
  'Managing Director/VP':  { Netherlands: 2200, Belgium: 2150, Germany: 2300, UK: 1850, Sweden: 23000, Denmark: 17000,Switzerland: 3100, France: 2200, Italy: 2000, Spain: 1800, Portugal: 1600, Poland: 9000, Russia: 180000,USA: 2700, Canada: 3100, Mexico: 45000, India: 150000,China: 15000 },
};
