import * as SQLite from 'expo-sqlite';

let _db: SQLite.WebSQLDatabase | null = null;

export function getDb(): SQLite.WebSQLDatabase {
  if (_db) return _db;
  _db = SQLite.openDatabase('habittracker.db');
  return _db;
}

export function initDb(): Promise<void> {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`CREATE TABLE IF NOT EXISTS habits (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          cadence TEXT NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          nudge_enabled INTEGER NOT NULL DEFAULT 0,
          nudge_hour INTEGER,
          nudge_minute INTEGER,
          timer_enabled INTEGER NOT NULL DEFAULT 0,
          min_required_minutes INTEGER,
          default_session_minutes INTEGER
        );`);

        tx.executeSql(`CREATE TABLE IF NOT EXISTS completions (
          id TEXT PRIMARY KEY,
          habit_id TEXT NOT NULL,
          ymd TEXT NOT NULL,
          completed INTEGER NOT NULL,
          completed_at INTEGER,
          duration_sec INTEGER NOT NULL DEFAULT 0,
          nudge_at INTEGER,
          FOREIGN KEY(habit_id) REFERENCES habits(id)
        );`);

        tx.executeSql(`CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          habit_id TEXT NOT NULL,
          ymd TEXT NOT NULL,
          started_at INTEGER NOT NULL,
          stopped_at INTEGER NOT NULL,
          duration_sec INTEGER NOT NULL,
          FOREIGN KEY(habit_id) REFERENCES habits(id)
        );`);

        tx.executeSql(`CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );`);
      },
      (err) => reject(err),
      () => resolve()
    );
  });
}

export function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value;`,
          [key, value]
        );
      },
      (e) => reject(e),
      () => resolve()
    );
  });
}

export function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  return new Promise((resolve, reject) => {
    db.readTransaction(
      (tx) => {
        tx.executeSql(
          `SELECT value FROM settings WHERE key = ? LIMIT 1;`,
          [key],
          (_t, rs) => {
            if (rs.rows.length > 0) resolve((rs.rows.item(0) as any).value as string);
            else resolve(null);
          }
        );
      },
      (e) => reject(e)
    );
  });
}

