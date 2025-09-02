export const DEFAULT_BADGE_TIERS = [
  { minutes: 5, label: 'red' as const },
  { minutes: 10, label: 'yellow' as const },
  { minutes: 15, label: 'green' as const },
  { minutes: 30, label: 'blue' as const },
];

export function computeBadge(minutes: number, tiers = DEFAULT_BADGE_TIERS) {
  let current: typeof tiers[number]['label'] | undefined;
  for (const t of tiers) if (minutes >= t.minutes) current = t.label;
  return current;
}
