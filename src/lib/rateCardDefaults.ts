import { RateCard } from './types';

export const defaultRateCard: RateCard = {
  Junior:    { Netherlands: 650,  Belgium: 600,  Germany: 700,  UK: 750,  Sweden: 680,  USA: 800  },
  Mid:       { Netherlands: 900,  Belgium: 850,  Germany: 950,  UK: 1000, Sweden: 920,  USA: 1100 },
  Senior:    { Netherlands: 1200, Belgium: 1150, Germany: 1250, UK: 1350, Sweden: 1220, USA: 1450 },
  Principal: { Netherlands: 1500, Belgium: 1450, Germany: 1550, UK: 1650, Sweden: 1520, USA: 1800 },
  Partner:   { Netherlands: 2000, Belgium: 1950, Germany: 2100, UK: 2200, Sweden: 2050, USA: 2500 },
};
