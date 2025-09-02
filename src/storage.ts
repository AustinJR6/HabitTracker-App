import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitLog } from './types';

const HABITS_KEY = 'habits';
const logsKey = (ymd: string) => `logs_${ymd}`; // ymd = YYYY-MM-DD

// ----- Habits -----
export async function getHabits(): Promise<Habit[]> {
  try {
    const raw = await AsyncStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // safe migrations
    return arr.map((h: any) => ({
      reminders: Array.isArray(h.reminders) ? h.reminders : [],
      timed: !!h.timed,
      ...h,
    })) as Habit[];
  } catch {
    return [];
  }
}

export async function setHabits(next: Habit[]): Promise<void> {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(next));
}

export async function upsertHabit(h: Habit): Promise<void> {
  const arr = await getHabits();
  const idx = arr.findIndex(x => x.id === h.id);
  if (idx >= 0) arr[idx] = h; else arr.push(h);
  await setHabits(arr);
}

export async function deleteHabit(id: string): Promise<void> {
  const arr = await getHabits();
  const next = arr.filter(x => x.id !== id);
  await setHabits(next);
}

// ----- Logs -----
export async function getLogsByDate(ymd: string): Promise<HabitLog[]> {
  try {
    const raw = await AsyncStorage.getItem(logsKey(ymd));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as HabitLog[];
  } catch {
    return [];
  }
}

export async function setLogsByDate(ymd: string, logs: HabitLog[]): Promise<void> {
  await AsyncStorage.setItem(logsKey(ymd), JSON.stringify(logs));
}

export async function logHabit(entry: HabitLog): Promise<void> {
  const { date, habitId } = entry;
  const logs = await getLogsByDate(date);
  const filtered = logs.filter(l => l.habitId !== habitId);
  filtered.push(entry);
  await setLogsByDate(date, filtered);
}

