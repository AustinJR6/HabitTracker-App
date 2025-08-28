import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from 'react';
import { AppStateShape, HabitId } from '../utils/types';
import { loadAppState, saveAppState } from '../utils/storage';
import { allFalseHabitsState } from '../constants/habits';
import { getTodayKey } from '../utils/date';

interface AppStore {
  state: AppStateShape;
  toggleHabit: (id: HabitId) => void;
  checkRollover: () => void;
  init: () => Promise<void>;
}

const AppStoreContext = createContext<AppStore | undefined>(undefined);

export const AppStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppStateShape>({
    streak: 0,
    currentDateKey: getTodayKey(),
    habits: { ...allFalseHabitsState },
    dayCompleted: false,
  });

  const persist = useCallback(async (newState: AppStateShape) => {
    setState(newState);
    await saveAppState(newState);
  }, []);

  const init = useCallback(async () => {
    const stored = await loadAppState();
    if (stored) {
      setState(stored);
    } else {
      const fresh: AppStateShape = {
        streak: 0,
        currentDateKey: getTodayKey(),
        habits: { ...allFalseHabitsState },
        dayCompleted: false,
      };
      await saveAppState(fresh);
      setState(fresh);
    }
  }, []);

  const toggleHabit = useCallback(
    (id: HabitId) => {
      const updatedHabits = { ...state.habits, [id]: !state.habits[id] };
      let { streak, dayCompleted } = state;
      const allDone = Object.values(updatedHabits).every(Boolean);
      if (allDone && !dayCompleted) {
        streak += 1;
        dayCompleted = true;
      }
      const newState: AppStateShape = {
        ...state,
        habits: updatedHabits,
        streak,
        dayCompleted,
      };
      persist(newState);
    },
    [state, persist]
  );

  const checkRollover = useCallback(() => {
    const todayKey = getTodayKey();
    if (state.currentDateKey !== todayKey) {
      const newState: AppStateShape = {
        ...state,
        currentDateKey: todayKey,
        habits: { ...allFalseHabitsState },
        dayCompleted: false,
      };
      persist(newState);
    }
  }, [state, persist]);

  return (
    <AppStoreContext.Provider value={{ state, toggleHabit, checkRollover, init }}>
      {children}
    </AppStoreContext.Provider>
  );
};

export const useAppStore = (): AppStore => {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return ctx;
};

