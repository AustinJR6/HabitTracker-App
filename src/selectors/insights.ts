import { getDb } from '../db';

export async function getDailyCompletion(fromYmd: string, toYmd: string) {
  const db = getDb();
  return new Promise<any[]>((resolve, reject) => {
    db.readTransaction(
      (tx: any) => {
        tx.executeSql(
          `SELECT ymd, SUM(completed) AS completedCount,
                  COUNT(*) AS total, SUM(duration_sec) AS seconds
           FROM completions
           WHERE ymd BETWEEN ? AND ?
           GROUP BY ymd
           ORDER BY ymd;`,
          [fromYmd, toYmd],
          (_t: any, rs: any) => {
            const arr: any[] = [];
            for (let i = 0; i < rs.rows.length; i++) arr.push(rs.rows.item(i));
            resolve(arr);
          }
        );
      },
      (e: any) => reject(e)
    );
  });
}

export async function getHabitStreaks(habitId: string) {
  const db = getDb();
  // compute contiguous streak backwards from latest completed
  return new Promise<number>((resolve, reject) => {
    db.readTransaction(
      (tx: any) => {
        tx.executeSql(
          `SELECT ymd FROM completions WHERE habit_id=? AND completed=1 ORDER BY ymd DESC;`,
          [habitId],
          (_t: any, rs: any) => {
            const days: string[] = [];
            for (let i = 0; i < rs.rows.length; i++) days.push(rs.rows.item(i).ymd);
            let streak = 0;
            if (days.length > 0) {
              let cursor = days[0];
              streak = 1;
              for (let i = 1; i < days.length; i++) {
                const next = days[i];
                const d1 = new Date(cursor + 'T00:00:00Z').getTime();
                const d0 = new Date(next + 'T00:00:00Z').getTime();
                if (Math.abs(d1 - d0) === 86400000) {
                  streak += 1;
                  cursor = next;
                } else {
                  break;
                }
              }
            }
            resolve(streak);
          }
        );
      },
      (e: any) => reject(e)
    );
  });
}

export async function getTimeOfDayHistogram(habitId: string) {
  const db = getDb();
  return new Promise<any[]>((resolve, reject) => {
    db.readTransaction(
      (tx: any) => {
        tx.executeSql(
          `SELECT CAST(strftime('%H', datetime(completed_at/1000, 'unixepoch')) AS INTEGER) AS hour,
                  COUNT(*) AS hits
           FROM completions
           WHERE habit_id = ? AND completed = 1 AND completed_at IS NOT NULL
           GROUP BY hour ORDER BY hour;`,
          [habitId],
          (_t: any, rs: any) => {
            const arr: any[] = [];
            for (let i = 0; i < rs.rows.length; i++) arr.push(rs.rows.item(i));
            resolve(arr);
          }
        );
      },
      (e: any) => reject(e)
    );
  });
}

export async function getTimeOnTaskSeries(habitId: string | null, fromYmd: string, toYmd: string) {
  const db = getDb();
  return new Promise<any[]>((resolve, reject) => {
    db.readTransaction(
      (tx: any) => {
        tx.executeSql(
          `SELECT ymd, SUM(duration_sec) AS seconds
           FROM completions
           WHERE (? IS NULL OR habit_id = ?)
             AND ymd BETWEEN ? AND ?
           GROUP BY ymd ORDER BY ymd;`,
          [habitId, habitId, fromYmd, toYmd],
          (_t: any, rs: any) => {
            const arr: any[] = [];
            for (let i = 0; i < rs.rows.length; i++) arr.push(rs.rows.item(i));
            resolve(arr);
          }
        );
      },
      (e: any) => reject(e)
    );
  });
}

export async function getNudgeEffectiveness(habitId: string) {
  const db = getDb();
  return new Promise<number | null>((resolve, reject) => {
    db.readTransaction(
      (tx: any) => {
        tx.executeSql(
          `SELECT SUM(CASE WHEN completed=1
                            AND nudge_at IS NOT NULL
                            AND ABS(completed_at - nudge_at) <= 120*60*1000
                          THEN 1 ELSE 0 END) * 1.0
                  / NULLIF(SUM(CASE WHEN completed=1 THEN 1 ELSE 0 END),0) AS pct
           FROM completions
           WHERE habit_id = ?;`,
          [habitId],
          (_t: any, rs: any) => {
            if (rs.rows.length > 0) resolve(rs.rows.item(0).pct ?? null);
            else resolve(null);
          }
        );
      },
      (e: any) => reject(e)
    );
  });
}
