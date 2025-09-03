export const DEFAULT_TIERS = [
  { value: 5,  label: 'red'   as const },
  { value: 10, label: 'yellow' as const },
  { value: 15, label: 'green'  as const },
  { value: 30, label: 'blue'   as const },
];

export function computeBadge(total: number, tiers = DEFAULT_TIERS) {
  let current: typeof tiers[number]['label'] | undefined;
  for (const t of tiers) if (total >= t.value) current = t.label;
  return current;
}

export function formatMinutes(m: number) {
  if (!Number.isFinite(m)) return '0m';
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm ? `${h}h ${mm}m` : `${h}h`;
  }
  return `${m}m`;
}
