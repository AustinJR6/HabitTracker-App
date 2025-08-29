import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import dayjs from 'dayjs';

export type HabitId = string;
export type ISODate = string; // YYYY-MM-DD

export type Habit = {
  id: HabitId;
  name: string;
  category?: 'Fitness' | 'Coding' | 'Family' | 'Finance' | 'Mindset' | 'Health' | 'Other';
  createdAt: number; // epoch ms
  archivedAt?: number;
  // schedule
  frequency: 'daily' | 'weeklyDays';
  daysOfWeek?: number[]; // when frequency==='weeklyDays'; 0=Sun..6=Sat
  // reminders
  reminders?: string[]; // "HH:mm" 24h times
  // goal type
  goalType: 'check' | 'count';
  dailyTarget?: number; // for 'count' (e.g., water 8)
};

export type HabitStatus = 'pending' | 'completed' | 'skipped' | 'missed';

export type HabitLog = {
  id: string;
  habitId: HabitId;
  date: ISODate; // e.g., "2025-08-28"
  status: HabitStatus;
  count?: number; // progress for count-based
  completedAt?: number;
};

type State = {
  habits: Habit[];
  logs: HabitLog[]; // append-only per day
};

type Actions = {
  addHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => Habit;
  updateHabit: (id: HabitId, patch: Partial<Habit>) => void;
  archiveHabit: (id: HabitId) => void;
  logStatus: (habitId: HabitId, date: ISODate, status: HabitStatus, count?: number) => void;
  dayView: (date: ISODate) => { due: Habit[]; logs: HabitLog[] };
};

const kv = new MMKV({ id: 'habit-tracker' });

const load = <T,>(key: string, fallback: T): T => {
  try {
    const v = kv.getString(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const persist = (key: string, v: any) => kv.set(key, JSON.stringify(v));

const uuid = () => {
  // Prefer native crypto.randomUUID if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = (global as any).crypto;
  if (c?.randomUUID) return c.randomUUID() as string;
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useHabitStore = create<State & Actions>((set, get) => ({
  habits: load('habits', []),
  logs: load('logs', []),

  addHabit: (h) => {
    const habit: Habit = { id: uuid(), createdAt: Date.now(), ...h };
    const habits = [...get().habits, habit];
    persist('habits', habits);
    set({ habits });
    return habit;
  },

  updateHabit: (id, patch) => {
    const habits = get().habits.map((x) => (x.id === id ? { ...x, ...patch } : x));
    persist('habits', habits);
    set({ habits });
  },

  archiveHabit: (id) => {
    const habits = get().habits.map((x) => (x.id === id ? { ...x, archivedAt: Date.now() } : x));
    persist('habits', habits);
    set({ habits });
  },

  logStatus: (habitId, date, status, count) => {
    const logs = get()
      .logs.filter((l) => !(l.habitId === habitId && l.date === date));
    logs.push({ id: uuid(), habitId, date, status, count, completedAt: status === 'completed' ? Date.now() : undefined });
    persist('logs', logs);
    set({ logs });
  },

  dayView: (date) => {
    const dow = dayjs(date).day(); // 0..6
    const due = get().habits.filter(
      (h) => !h.archivedAt && (h.frequency === 'daily' || h.daysOfWeek?.includes(dow))
    );
    const logs = get().logs.filter((l) => l.date === date);
    return { due, logs };
  },
}));

