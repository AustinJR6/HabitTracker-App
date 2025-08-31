export type Habit = {
  id: string;
  name: string;
  cadence: 'daily' | 'weekly' | 'custom';
  archived: boolean;
  createdAt: number;
  nudgeEnabled: boolean;
  nudgeHour?: number;
  nudgeMinute?: number;
  timerEnabled: boolean;
  minRequiredMinutes?: number;
  defaultSessionMinutes?: number;
};

export type Completion = {
  id: string;
  habitId: string;
  ymd: string;
  completed: boolean;
  completedAt?: number;
  durationSec: number;
  nudgeAt?: number;
};

export type Session = {
  id: string;
  habitId: string;
  ymd: string;
  startedAt: number;
  stoppedAt: number;
  durationSec: number;
};

