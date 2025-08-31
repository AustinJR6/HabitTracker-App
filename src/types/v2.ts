export type Weekday = 'Sun'|'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat';

export type Milestone = {
  minutes: number;
  badge: string; // e.g., 'red' | 'yellow' | 'green' | 'blue'
};

export type HabitV2 = {
  habitId: string; // uuid or unique string
  name: string;
  days: Weekday[]; // which weekdays it's due
  useTimer: boolean;
  minTime?: number; // minutes, required if useTimer
  milestones?: Milestone[]; // optional ranked milestones
  notificationTime?: { hour: number; minute: number } | null; // optional nudge time
};

export type HabitLogV2 = {
  date: string; // YYYY-MM-DD
  habitId: string;
  completed: boolean;
  duration: number; // minutes
  badge?: string; // badge if milestones exist
};

