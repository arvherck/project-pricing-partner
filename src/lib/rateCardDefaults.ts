import { RateCard } from './types';

// Rates are in local currency per HOUR per country
export const defaultRateCard: RateCard = {
  'Junior Consultant':     { Netherlands: 81,  Belgium: 75,  Germany: 88,  UK: 69,  Sweden: 875,  Denmark: 625, Switzerland: 113,  France: 81,  Italy: 69,  Spain: 63,  Portugal: 56,  Poland: 313, Russia: 6250, USA: 100,  Canada: 113,  Mexico: 1500, India: 4375, China: 500 },
  'Consultant':            { Netherlands: 113, Belgium: 106, Germany: 119, UK: 94,  Sweden: 1188, Denmark: 875, Switzerland: 150, France: 113, Italy: 100, Spain: 88,  Portugal: 81,  Poland: 438, Russia: 8750, USA: 138, Canada: 156, Mexico: 2000, India: 6250, China: 688 },
  'Senior Consultant':     { Netherlands: 150, Belgium: 144, Germany: 156, UK: 125, Sweden: 1563, Denmark: 1125,Switzerland: 200, France: 150, Italy: 131, Spain: 119, Portugal: 106, Poland: 563, Russia: 11250,USA: 181, Canada: 206, Mexico: 2750, India: 8750, China: 938 },
  'Manager':               { Netherlands: 188, Belgium: 181, Germany: 194, UK: 156, Sweden: 1938, Denmark: 1438,Switzerland: 250, France: 188, Italy: 163, Spain: 150, Portugal: 131, Poland: 688, Russia: 13750,USA: 225, Canada: 250, Mexico: 3500, India: 11250,China: 1188 },
  'Sr. Manager':           { Netherlands: 225, Belgium: 219, Germany: 238, UK: 188, Sweden: 2375, Denmark: 1750,Switzerland: 313, France: 225, Italy: 200, Spain: 181, Portugal: 163, Poland: 875, Russia: 17500,USA: 275, Canada: 313, Mexico: 4375, India: 14375,China: 1500 },
  'Managing Director/VP':  { Netherlands: 275, Belgium: 269, Germany: 288, UK: 231, Sweden: 2875, Denmark: 2125,Switzerland: 388, France: 275, Italy: 250, Spain: 225, Portugal: 200, Poland: 1125,Russia: 22500,USA: 338, Canada: 388, Mexico: 5625, India: 18750,China: 1875 },
};
