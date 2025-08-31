import { initDb } from './db';
import { ensureNotifPermissions } from './notifications';
import { ensureDailyNotifications } from './services/nudges';
import { getTimezone } from './utils/time';

export async function bootstrap() {
  await initDb();
  try { await ensureNotifPermissions(); } catch {}
  try {
    const tz = await getTimezone();
    await ensureDailyNotifications(tz);
  } catch {}
}

