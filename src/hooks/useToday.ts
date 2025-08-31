import { useEffect, useState } from 'react';
import { getDb } from '../db';
import { getTimezone, ymd } from '../utils/time';

type Today = { completedCount: number; total: number; seconds: number };

export function useToday() {
  const [state, setState] = useState<Today>({ completedCount: 0, total: 0, seconds: 0 });
  useEffect(() => {
    (async () => {
      const tz = await getTimezone();
      const today = ymd(new Date(), tz);
      const db = getDb();
      db.readTransaction((tx) => {
        tx.executeSql(
          `SELECT SUM(completed) AS completedCount, COUNT(*) AS total, SUM(duration_sec) AS seconds FROM completions WHERE ymd = ?;`,
          [today],
          (_t, rs) => {
            if (rs.rows.length > 0) {
              const r = rs.rows.item(0) as any;
              setState({ completedCount: r.completedCount ?? 0, total: r.total ?? 0, seconds: r.seconds ?? 0 });
            }
          }
        );
      });
    })();
  }, []);
  return state;
}

