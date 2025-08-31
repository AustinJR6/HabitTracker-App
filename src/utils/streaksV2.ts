import dayjs from 'dayjs';
import { HabitV2 } from '../types/v2';
import { getLogsByDateV2 } from '../services/storageV2';

const DOW: ('Sun'|'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat')[] = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export type PerHabitStreaks = Record<string, number>; // habitId -> streak

export async function computeStreaksV2(habits: HabitV2[], limitDays = 365): Promise<{ overall: number; perHabit: PerHabitStreaks } > {
  const perHabit: PerHabitStreaks = Object.fromEntries(habits.map(h => [h.habitId, 0]));
  const broken: Record<string, boolean> = Object.fromEntries(habits.map(h => [h.habitId, false]));
  let overall = 0;
  let overallBroken = false;

  for (let i = 0; i < limitDays; i++) {
    const d = dayjs().subtract(i, 'day');
    const ymd = d.format('YYYY-MM-DD');
    const dow = DOW[d.day()];
    const due = habits.filter(h => h.days.includes(dow));
    if (due.length === 0) continue; // skip days with no due habits

    const logs = await getLogsByDateV2(ymd);
    const completedSet = new Set(logs.filter(l => l.completed).map(l => l.habitId));

    // overall
    const allDone = due.every(h => completedSet.has(h.habitId));
    if (!overallBroken) {
      if (allDone) overall += 1; else overallBroken = true;
    }

    // per-habit streaks
    for (const h of habits) {
      if (broken[h.habitId]) continue;
      const dueToday = h.days.includes(dow);
      if (!dueToday) continue;
      if (completedSet.has(h.habitId)) perHabit[h.habitId] += 1; else broken[h.habitId] = true;
    }

    const allHabitBroken = Object.values(broken).every(v => v);
    if (overallBroken && allHabitBroken) break;
  }

  return { overall, perHabit };
}

