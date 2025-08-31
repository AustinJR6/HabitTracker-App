import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function getTimezone(): Promise<string> {
  try {
    // Fallback to device tz; settings storage can be layered later
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function ymd(date: Date, tz: string): string {
  return dayjs(date).tz(tz).format('YYYY-MM-DD');
}

export function startOfToday(tz: string): Dayjs {
  return dayjs().tz(tz).startOf('day');
}

export function toLocalTZ(date: Date, tz: string): Dayjs {
  return dayjs(date).tz(tz);
}

export type { Dayjs };

