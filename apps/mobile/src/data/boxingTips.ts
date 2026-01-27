// Daily Boxing Tips for Amateurs
// Curated wisdom from expert boxing coaches

export interface BoxingTip {
  id: string;
  category: 'fundamentals' | 'offense' | 'defense' | 'conditioning' | 'mental' | 'strategy';
  title: string;
  tip: string;
  icon: string;
}

export const BOXING_TIPS: BoxingTip[] = [
  // Fundamentals
  {
    id: 'tip_1',
    category: 'fundamentals',
    title: 'Relax Your Shoulders',
    tip: 'Tension in your shoulders wastes energy and slows your punches. Stay loose until the moment of impact, then snap.',
    icon: 'body',
  },
  {
    id: 'tip_2',
    category: 'fundamentals',
    title: 'Breathe With Every Punch',
    tip: 'Exhale sharply when you throw. This tightens your core, adds power, and prevents you from holding your breath.',
    icon: 'cloud',
  },
  {
    id: 'tip_3',
    category: 'fundamentals',
    title: 'Return Hands Fast',
    tip: "Your punch isn't complete until your hand is back at your chin. A slow return leaves you open to counters.",
    icon: 'return-down-back',
  },
  {
    id: 'tip_4',
    category: 'fundamentals',
    title: 'Stay on the Balls of Your Feet',
    tip: "Flat-footed fighters can't move quickly. Keep your weight on the balls of your feet for mobility.",
    icon: 'footsteps',
  },
  {
    id: 'tip_5',
    category: 'fundamentals',
    title: 'Chin Down Always',
    tip: 'Your chin is your off switch. Keep it tucked behind your lead shoulder at all times.',
    icon: 'shield-checkmark',
  },

  // Offense
  {
    id: 'tip_6',
    category: 'offense',
    title: 'Double Up the Jab',
    tip: 'One jab is expected. Two jabs disrupt timing and set up your power shots. Make the double jab your friend.',
    icon: 'flash',
  },
  {
    id: 'tip_7',
    category: 'offense',
    title: 'Punch Through the Target',
    tip: "Don't aim at the surface - aim 6 inches through it. This creates penetrating power.",
    icon: 'arrow-forward',
  },
  {
    id: 'tip_8',
    category: 'offense',
    title: 'Set Up the Body',
    tip: 'Go to the head to lower the hands, then attack the body. The body shot is the great equalizer.',
    icon: 'fitness',
  },
  {
    id: 'tip_9',
    category: 'offense',
    title: 'Throw in Bunches',
    tip: 'Single punches are easy to defend. Combinations overwhelm opponents and score points.',
    icon: 'layers',
  },
  {
    id: 'tip_10',
    category: 'offense',
    title: 'The Jab is Your Best Friend',
    tip: 'Use it to measure distance, disrupt rhythm, set up power shots, and keep opponents honest.',
    icon: 'hand-left',
  },

  // Defense
  {
    id: 'tip_11',
    category: 'defense',
    title: 'Move Your Head',
    tip: 'A stationary head is an easy target. Small movements - slips, rolls, pulls - make you hard to hit.',
    icon: 'swap-horizontal',
  },
  {
    id: 'tip_12',
    category: 'defense',
    title: 'See the Punch',
    tip: "You can't defend what you can't see. Keep your eyes on your opponent's chest - you'll see everything.",
    icon: 'eye',
  },
  {
    id: 'tip_13',
    category: 'defense',
    title: 'Counter After Defense',
    tip: 'Defense without offense is just delay. Every slip, roll, or block should set up your counter.',
    icon: 'git-compare',
  },
  {
    id: 'tip_14',
    category: 'defense',
    title: 'Use Your Legs',
    tip: 'Sometimes the best defense is not being there. Footwork creates angles and distance.',
    icon: 'walk',
  },
  {
    id: 'tip_15',
    category: 'defense',
    title: 'Catch and Shoot',
    tip: 'When you catch a jab with your rear hand, your lead hand is free to counter immediately.',
    icon: 'hand-right',
  },

  // Conditioning
  {
    id: 'tip_16',
    category: 'conditioning',
    title: 'Roadwork is Non-Negotiable',
    tip: 'Running builds the cardio base that lets you fight hard in late rounds. 3-5 miles, 3x per week minimum.',
    icon: 'walk',
  },
  {
    id: 'tip_17',
    category: 'conditioning',
    title: 'Jump Rope Daily',
    tip: "15-20 minutes of rope improves footwork, timing, and conditioning. It's the boxer's favorite tool.",
    icon: 'pulse',
  },
  {
    id: 'tip_18',
    category: 'conditioning',
    title: 'Train in Rounds',
    tip: 'Do everything in 3-minute rounds with 1-minute rest. This mimics fight conditions.',
    icon: 'timer',
  },
  {
    id: 'tip_19',
    category: 'conditioning',
    title: "Don't Skip Core Work",
    tip: 'Your core transfers power from legs to fists and protects you from body shots. Train it daily.',
    icon: 'barbell',
  },
  {
    id: 'tip_20',
    category: 'conditioning',
    title: 'Recovery is Training',
    tip: 'Sleep 8 hours, stretch daily, and take rest days. Overtraining leads to injury and burnout.',
    icon: 'bed',
  },

  // Mental
  {
    id: 'tip_21',
    category: 'mental',
    title: 'Stay Calm Under Fire',
    tip: "When you get hit, don't panic. Breathe, reset, and fight your fight. Composure wins battles.",
    icon: 'leaf',
  },
  {
    id: 'tip_22',
    category: 'mental',
    title: 'Visualize Success',
    tip: 'Before training, spend 5 minutes mentally rehearsing perfect technique. Your brain learns from imagination.',
    icon: 'bulb',
  },
  {
    id: 'tip_23',
    category: 'mental',
    title: 'Respect Every Opponent',
    tip: 'Underestimating anyone is dangerous. Treat every sparring partner and opponent with respect.',
    icon: 'people',
  },
  {
    id: 'tip_24',
    category: 'mental',
    title: 'Learn From Losses',
    tip: 'Every loss teaches something. Watch the footage, identify weaknesses, and improve.',
    icon: 'school',
  },
  {
    id: 'tip_25',
    category: 'mental',
    title: 'Trust Your Training',
    tip: "In the ring, there's no time to think. Trust the hours you've put in and let your body work.",
    icon: 'checkmark-done',
  },

  // Strategy
  {
    id: 'tip_26',
    category: 'strategy',
    title: 'Control the Center',
    tip: 'Ring generalship starts with controlling the center. Make your opponent fight on the outside.',
    icon: 'locate',
  },
  {
    id: 'tip_27',
    category: 'strategy',
    title: 'Adjust Between Rounds',
    tip: "Each round is a new fight. Assess what's working, what isn't, and adapt your strategy.",
    icon: 'options',
  },
  {
    id: 'tip_28',
    category: 'strategy',
    title: 'Exploit Patterns',
    tip: 'Everyone has habits. Watch for patterns and time your counters to their tendencies.',
    icon: 'analytics',
  },
  {
    id: 'tip_29',
    category: 'strategy',
    title: 'Pace Yourself',
    tip: "Don't win round 1 by 10 points and lose rounds 2-3. Distribute energy across all rounds.",
    icon: 'speedometer',
  },
  {
    id: 'tip_30',
    category: 'strategy',
    title: 'Cut Off the Ring',
    tip: "Don't chase - cut angles. Step to where they're going, not where they are.",
    icon: 'git-branch',
  },
];

/**
 * Get the daily tip based on current date
 * Changes at midnight local time
 */
export function getDailyTip(): BoxingTip {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const tipIndex = dayOfYear % BOXING_TIPS.length;
  return BOXING_TIPS[tipIndex];
}

/**
 * Get tips by category
 */
export function getTipsByCategory(category: BoxingTip['category']): BoxingTip[] {
  return BOXING_TIPS.filter((tip) => tip.category === category);
}
