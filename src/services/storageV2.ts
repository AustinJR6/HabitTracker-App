import AsyncStorage from '@react-native-async-storage/async-storage';
import { HabitLogV2, HabitV2 } from '../types/v2';

const HABITS_KEY = 'habits';
const logsKey = (ymd: string) => `logs_${ymd}`; // ymd = YYYY-MM-DD

export async function getHabitsV2(): Promise<HabitV2[]> {
  try {
    const raw = await AsyncStorage.getItem(HABITS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as HabitV2[];
  } catch {
    return [];
  }
}

export async function setHabitsV2(next: HabitV2[]): Promise<void> {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(next));
}

export async function upsertHabitV2(h: HabitV2): Promise<void> {
  const arr = await getHabitsV2();
  const idx = arr.findIndex(x => x.habitId === h.habitId);
  if (idx >= 0) arr[idx] = h; else arr.push(h);
  await setHabitsV2(arr);
}

export async function deleteHabitV2(habitId: string): Promise<void> {
  const arr = await getHabitsV2();
  const next = arr.filter(x => x.habitId !== habitId);
  await setHabitsV2(next);
}

export async function getLogsByDateV2(ymd: string): Promise<HabitLogV2[]> {
  try {
    const raw = await AsyncStorage.getItem(logsKey(ymd));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as HabitLogV2[];
  } catch {
    return [];
  }
}

export async function setLogsByDateV2(ymd: string, logs: HabitLogV2[]): Promise<void> {
  await AsyncStorage.setItem(logsKey(ymd), JSON.stringify(logs));
}

export async function logCompletionV2(entry: HabitLogV2): Promise<void> {
  const { date, habitId } = entry;
  const logs = await getLogsByDateV2(date);
  const filtered = logs.filter(l => !(l.habitId === habitId));
  filtered.push(entry);
  await setLogsByDateV2(date, filtered);
}

