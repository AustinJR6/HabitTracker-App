import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';

export type HabitId = string;
export type ISODate = string;

export type Habit = {
  id: HabitId;
  name: string;
  category?: 'Fitness'|'Coding'|'Family'|'Finance'|'Mindset'|'Health'|'Other';
  createdAt: number;
  archivedAt?: number;
  frequency: 'daily' | 'weeklyDays';
  daysOfWeek?: number[];           // 0=Sun..6=Sat
  reminders?: string[];            // "HH:mm"
  goalType: 'check' | 'count';
  dailyTarget?: number;
};

export type HabitStatus = 'pending' | 'completed' | 'skipped' | 'missed';

export type HabitLog = {
  id: string;
  habitId: HabitId;
  date: ISODate;
  status: HabitStatus;
  count?: number;
  completedAt?: number;
};

type State = {
  habits: Habit[];
  logs: HabitLog[];
};

type Actions = {
  addHabit: (h: Omit<Habit, 'id'|'createdAt'>) => Habit;
  updateHabit: (id: HabitId, patch: Partial<Habit>) => void;
  archiveHabit: (id: HabitId) => void;
  logStatus: (habitId: HabitId, date: ISODate, status: HabitStatus, count?: number) => void;
  dayView: (date: ISODate) => { due: Habit[]; logs: HabitLog[] };
};

export const useHabitStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],

      addHabit: (h) => {
        const id = (global as any).crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
        const habit: Habit = { id, createdAt: Date.now(), ...h };
        set({ habits: [...get().habits, habit] });
        return habit;
      },

      updateHabit: (id, patch) => {
        set({ habits: get().habits.map(x => x.id===id ? { ...x, ...patch } : x) });
      },

      archiveHabit: (id) => {
        set({ habits: get().habits.map(x => x.id===id ? { ...x, archivedAt: Date.now() } : x) });
      },

      logStatus: (habitId, date, status, count) => {
        const filtered = get().logs.filter(l => !(l.habitId===habitId && l.date===date));
        const next = [...filtered, { id: String(Date.now()+Math.random()), habitId, date, status, count, completedAt: status==='completed' ? Date.now() : undefined }];
        set({ logs: next });
      },

      dayView: (date) => {
        const dow = dayjs(date).day();
        const due = get().habits.filter(h => !h.archivedAt && (h.frequency === 'daily' || h.daysOfWeek?.includes(dow)));
        const logs = get().logs.filter(l => l.date === date);
        return { due, logs };
      },
    }),
    {
      name: 'habit-tracker',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

