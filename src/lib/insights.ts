import dayjs from 'dayjs';
import { Habit, HabitLog, MetricKind } from '../types';
import { HABIT_COLORS } from '../theme/palette';

export type ChartPoint = { x: string; y: number; habitId: string; habitName: string; color: string };

export function groupLogsByPeriod(logs: HabitLog[], period: 'week'|'month') {
  const categories = period === 'week'
    ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    : Array.from({ length: 31 }, (_, i) => String(i + 1));
  const byHabit: Record<string, ChartPoint[]> = {};
  for (const log of logs) {
    const d = dayjs(log.date);
    const idx = period === 'week' ? d.day() : d.date() - 1;
    const x = categories[idx];
    const val = log.durationMinutes ?? log.countValue ?? 0;
    if (!byHabit[log.habitId]) byHabit[log.habitId] = categories.map(c => ({ x: c, y: 0, habitId: log.habitId, habitName: '', color: '' }));
    byHabit[log.habitId][idx].y += val;
  }
  return { categories, byHabit };
}

export function buildDataset(habits: Habit[], logs: HabitLog[], metric: MetricKind, period: 'week'|'month') {
  const metricHabits = habits.filter(h => h.metric === metric);
  const filteredLogs = logs.filter(l => metricHabits.find(h => h.id === l.habitId));
  const { categories, byHabit } = groupLogsByPeriod(filteredLogs, period);
  const series = metricHabits.map((h, i) => ({
    habitId: h.id,
    habitName: h.name,
    color: h.displayColor || HABIT_COLORS[i % HABIT_COLORS.length],
    points: (byHabit[h.id] || categories.map(c => ({ x: c, y: 0, habitId: h.id, habitName: h.name, color: h.displayColor || HABIT_COLORS[i % HABIT_COLORS.length] }))).map(p => ({ ...p, habitName: h.name, color: h.displayColor || HABIT_COLORS[i % HABIT_COLORS.length] })),
  }));
  let unitLabel: string | undefined;
  if (metric === 'count') {
    const labels = metricHabits.map(h => h.unitLabel).filter(Boolean);
    unitLabel = labels.length && labels.every(l => l === labels[0]) ? labels[0] : undefined;
  }
  return { categories, series, unitLabel };
}
