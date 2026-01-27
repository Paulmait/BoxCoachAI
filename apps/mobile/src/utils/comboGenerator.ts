// Combo Generator Utility
import { Combo, ComboConfig, PUNCHES, Punch, PunchNumber } from '@/types/combo';

/**
 * Generate a random boxing combination
 */
export function generateCombo(config: ComboConfig): Combo {
  const { minPunches, maxPunches, includePowerPunches } = config;

  // Determine number of punches
  const numPunches = Math.floor(Math.random() * (maxPunches - minPunches + 1)) + minPunches;

  // Filter available punches based on config
  let availablePunches = [...PUNCHES];
  if (!includePowerPunches) {
    // Only include jab (1), cross (2), and lead hook (3)
    availablePunches = availablePunches.filter(p => p.number <= 3);
  }

  const selectedPunches: Punch[] = [];
  let lastPunchNumber: PunchNumber | null = null;

  for (let i = 0; i < numPunches; i++) {
    // Smart selection - avoid repeating same punch (except jab)
    let candidates = availablePunches;
    if (lastPunchNumber && lastPunchNumber !== 1) {
      candidates = availablePunches.filter(p => p.number !== lastPunchNumber);
    }

    // For better combos, prefer certain sequences
    if (i === 0) {
      // Start with jab or double jab setup most of the time
      if (Math.random() < 0.7) {
        candidates = availablePunches.filter(p => p.number === 1 || p.number === 2);
      }
    }

    const punch = candidates[Math.floor(Math.random() * candidates.length)];
    selectedPunches.push(punch);
    lastPunchNumber = punch.number;
  }

  return {
    punches: selectedPunches,
    displayNumbers: selectedPunches.map(p => p.number).join('-'),
    displayNames: selectedPunches.map(p => p.shortName).join('-'),
  };
}

/**
 * Generate a spoken callout for a combo
 */
export function getComboCallout(combo: Combo): string {
  return combo.punches.map(p => p.name).join('! ') + '!';
}

/**
 * Get the number callout (e.g., "1-2-3")
 */
export function getNumberCallout(combo: Combo): string {
  return combo.punches.map(p => p.number).join(', ');
}

/**
 * Classic boxing combinations for reference/presets
 */
export const CLASSIC_COMBOS: Combo[] = [
  // Basic combos
  {
    punches: [PUNCHES[0], PUNCHES[1]], // 1-2
    displayNumbers: '1-2',
    displayNames: 'Jab-Cross',
  },
  {
    punches: [PUNCHES[0], PUNCHES[0]], // 1-1
    displayNumbers: '1-1',
    displayNames: 'Jab-Jab',
  },
  {
    punches: [PUNCHES[0], PUNCHES[1], PUNCHES[2]], // 1-2-3
    displayNumbers: '1-2-3',
    displayNames: 'Jab-Cross-Hook',
  },
  // Intermediate combos
  {
    punches: [PUNCHES[0], PUNCHES[1], PUNCHES[2], PUNCHES[1]], // 1-2-3-2
    displayNumbers: '1-2-3-2',
    displayNames: 'Jab-Cross-Hook-Cross',
  },
  {
    punches: [PUNCHES[0], PUNCHES[0], PUNCHES[1]], // 1-1-2
    displayNumbers: '1-1-2',
    displayNames: 'Jab-Jab-Cross',
  },
  {
    punches: [PUNCHES[0], PUNCHES[1], PUNCHES[4]], // 1-2-5
    displayNumbers: '1-2-5',
    displayNames: 'Jab-Cross-Upper',
  },
  // Advanced combos
  {
    punches: [PUNCHES[0], PUNCHES[1], PUNCHES[2], PUNCHES[5]], // 1-2-3-6
    displayNumbers: '1-2-3-6',
    displayNames: 'Jab-Cross-Hook-Upper',
  },
  {
    punches: [PUNCHES[0], PUNCHES[5], PUNCHES[2]], // 1-6-3
    displayNumbers: '1-6-3',
    displayNames: 'Jab-Upper-Hook',
  },
];

/**
 * Get a random classic combo
 */
export function getRandomClassicCombo(): Combo {
  return CLASSIC_COMBOS[Math.floor(Math.random() * CLASSIC_COMBOS.length)];
}
