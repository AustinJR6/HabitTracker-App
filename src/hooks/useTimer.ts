import { useCallback, useMemo, useRef, useState } from 'react';

type ActiveTimer = { habitId: string; startTs: number } | null;

export function useTimer() {
  const [active, setActive] = useState<ActiveTimer>(null);

  const runningForSec = useMemo(() => {
    if (!active) return 0;
    return Math.floor((Date.now() - active.startTs) / 1000);
  }, [active]);

  const start = useCallback((habitId: string) => {
    setActive({ habitId, startTs: Date.now() });
  }, []);

  const stop = useCallback(() => {
    if (!active) return { habitId: '', minutes: 0 };
    const elapsedMin = Math.max(0, Math.round((Date.now() - active.startTs) / 60000));
    const hid = active.habitId;
    setActive(null);
    return { habitId: hid, minutes: elapsedMin };
  }, [active]);

  return { active, start, stop, runningForSec };
}

