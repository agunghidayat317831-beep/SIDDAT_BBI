import { FishCommodity, SizeCategory } from './types';

export const FISH_PRICES: Record<FishCommodity, Record<SizeCategory, number>> = {
  "Ikan Mas": {
    "1-3 cm": 500,
    "3-5 cm": 1000,
    "5-8 cm": 2000,
    "Indukan": 50000
  },
  "Nila": {
    "1-3 cm": 50,
    "3-5 cm": 200,
    "5-8 cm": 500,
    "Indukan": 25000
  },
  "Lele": {
    "1-3 cm": 200,
    "3-5 cm": 500,
    "5-8 cm": 1000,
    "Indukan": 30000
  }
};
