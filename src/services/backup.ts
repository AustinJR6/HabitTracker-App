import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDb } from '../db';

export async function exportDbToJson(): Promise<string> {
  const db = getDb();
  const dump: Record<string, any[]> = { habits: [], completions: [], sessions: [], settings: [] };
  await new Promise<void>((resolve, reject) => {
    db.readTransaction((tx: any) => {
      const tables = Object.keys(dump);
      let remaining = tables.length;
      for (const t of tables) {
        tx.executeSql(`SELECT * FROM ${t};`, [], (_t: any, rs: any) => {
          const arr: any[] = [];
          for (let i = 0; i < rs.rows.length; i++) arr.push(rs.rows.item(i));
          dump[t] = arr;
          remaining -= 1;
          if (remaining === 0) resolve();
        });
      }
    }, (e: any) => reject(e));
  });

  const json = JSON.stringify(dump, null, 2);
  const file = FileSystem.documentDirectory + `habittracker-backup-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(file, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file);
  }
  return file;
}

export async function importDbFromJson(fileUri: string): Promise<void> {
  const db = getDb();
  const json = await FileSystem.readAsStringAsync(fileUri);
  const data = JSON.parse(json) as Record<string, any[]>;
  await new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx: any) => {
        tx.executeSql('DELETE FROM habits;');
        tx.executeSql('DELETE FROM completions;');
        tx.executeSql('DELETE FROM sessions;');
        tx.executeSql('DELETE FROM settings;');

        for (const h of data.habits ?? []) {
          tx.executeSql(
            `INSERT INTO habits(id,name,cadence,archived,created_at,nudge_enabled,nudge_hour,nudge_minute,timer_enabled,min_required_minutes,default_session_minutes)
             VALUES(?,?,?,?,?,?,?,?,?,?,?);`,
            [h.id, h.name, h.cadence, h.archived ? 1 : 0, h.created_at, h.nudge_enabled ? 1 : 0, h.nudge_hour, h.nudge_minute, h.timer_enabled ? 1 : 0, h.min_required_minutes, h.default_session_minutes]
          );
        }
        for (const c of data.completions ?? []) {
          tx.executeSql(
            `INSERT INTO completions(id,habit_id,ymd,completed,completed_at,duration_sec,nudge_at) VALUES(?,?,?,?,?,?,?);`,
            [c.id, c.habit_id, c.ymd, c.completed ? 1 : 0, c.completed_at, c.duration_sec ?? 0, c.nudge_at]
          );
        }
        for (const s of data.sessions ?? []) {
          tx.executeSql(
            `INSERT INTO sessions(id,habit_id,ymd,started_at,stopped_at,duration_sec) VALUES(?,?,?,?,?,?);`,
            [s.id, s.habit_id, s.ymd, s.started_at, s.stopped_at, s.duration_sec]
          );
        }
        for (const kv of data.settings ?? []) {
          tx.executeSql(`INSERT INTO settings(key,value) VALUES(?,?);`, [kv.key, kv.value]);
        }
      },
      (e: any) => reject(e),
      () => resolve()
    );
  });
}
