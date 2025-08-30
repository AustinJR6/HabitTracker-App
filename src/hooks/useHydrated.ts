import { useEffect, useState } from 'react';
import { useHabitStore } from '../store/habits';

export function useHydrated() {
  const [ready, setReady] = useState<boolean>((useHabitStore as any).persist?.hasHydrated?.() ?? false);
  useEffect(() => {
    const unsub = (useHabitStore as any).persist?.onFinishHydration?.(() => setReady(true));
    return () => { unsub?.(); };
  }, []);
  return ready;
}

