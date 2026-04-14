import { RateCard } from './types';

// Rates are in local currency per country:
// Netherlands/Belgium/Germany = EUR, UK = GBP, Sweden = SEK, USA = USD
export const defaultRateCard: RateCard = {
  'Junior Consultant':     { Netherlands: 650,  Belgium: 600,  Germany: 700,  UK: 550,  Sweden: 7000,  USA: 800  },
  'Consultant':            { Netherlands: 900,  Belgium: 850,  Germany: 950,  UK: 750,  Sweden: 9500,  USA: 1100 },
  'Senior Consultant':     { Netherlands: 1200, Belgium: 1150, Germany: 1250, UK: 1000, Sweden: 12500, USA: 1450 },
  'Manager':               { Netherlands: 1500, Belgium: 1450, Germany: 1550, UK: 1250, Sweden: 15500, USA: 1800 },
  'Sr. Manager':           { Netherlands: 1800, Belgium: 1750, Germany: 1900, UK: 1500, Sweden: 19000, USA: 2200 },
  'Managing Director/VP':  { Netherlands: 2200, Belgium: 2150, Germany: 2300, UK: 1850, Sweden: 23000, USA: 2700 },
};
