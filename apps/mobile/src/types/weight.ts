// Weight tracking types for competition boxers

export interface WeightEntry {
  id: string;
  date: string; // ISO date
  weight: number; // in lbs or kg based on user preference
  unit: 'lbs' | 'kg';
  notes?: string;
  fightWeightTarget?: number;
}

export interface WeightClass {
  name: string;
  minWeight: number;
  maxWeight: number;
  unit: 'lbs' | 'kg';
}

// Standard amateur boxing weight classes (in lbs)
export const AMATEUR_WEIGHT_CLASSES: WeightClass[] = [
  { name: 'Light Flyweight', minWeight: 0, maxWeight: 108, unit: 'lbs' },
  { name: 'Flyweight', minWeight: 108, maxWeight: 112, unit: 'lbs' },
  { name: 'Bantamweight', minWeight: 112, maxWeight: 118, unit: 'lbs' },
  { name: 'Featherweight', minWeight: 118, maxWeight: 126, unit: 'lbs' },
  { name: 'Lightweight', minWeight: 126, maxWeight: 132, unit: 'lbs' },
  { name: 'Light Welterweight', minWeight: 132, maxWeight: 141, unit: 'lbs' },
  { name: 'Welterweight', minWeight: 141, maxWeight: 152, unit: 'lbs' },
  { name: 'Middleweight', minWeight: 152, maxWeight: 165, unit: 'lbs' },
  { name: 'Light Heavyweight', minWeight: 165, maxWeight: 178, unit: 'lbs' },
  { name: 'Heavyweight', minWeight: 178, maxWeight: 201, unit: 'lbs' },
  { name: 'Super Heavyweight', minWeight: 201, maxWeight: 999, unit: 'lbs' },
];

export function getWeightClass(weight: number, unit: 'lbs' | 'kg'): WeightClass | null {
  const weightInLbs = unit === 'kg' ? weight * 2.20462 : weight;
  return (
    AMATEUR_WEIGHT_CLASSES.find(
      (wc) => weightInLbs > wc.minWeight && weightInLbs <= wc.maxWeight
    ) || null
  );
}

export function convertWeight(weight: number, from: 'lbs' | 'kg', to: 'lbs' | 'kg'): number {
  if (from === to) return weight;
  return from === 'lbs' ? weight / 2.20462 : weight * 2.20462;
}
