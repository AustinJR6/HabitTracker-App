export type MetricKind = 'time' | 'count';
export type BadgeLabel = 'red' | 'yellow' | 'green' | 'blue';

export type Habit = {
  id: string;
  name: string;
  days: number[];               // 0..6
  timed: boolean;               // derived from metric === 'time'
  metric: MetricKind;           // 'time' or 'count'
  unitLabel?: string;           // e.g. 'min', 'word', 'lesson'
  minMinutes?: number;          // when metric='time'
  reminders?: string[];         // ["07:30 AM", "09:00 PM"]
  displayColor?: string;        // HEX from preset palette
  milestonesEnabled?: boolean;
  milestoneTiers?: { value: number; label: BadgeLabel }[];
  reminderIds?: string[];       // scheduled notification ids
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: string;                 // YYYY-MM-DD
  completed: boolean;           // true when any progress made
  durationMinutes?: number;     // when metric='time'
  countValue?: number;          // when metric='count'
  lastBadge?: BadgeLabel;
};

export type RunningTimer = {
  habitId: string;
  startedAt: string; // ISO timestamp
};
