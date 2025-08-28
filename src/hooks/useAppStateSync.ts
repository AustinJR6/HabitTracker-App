import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAppStore } from '../state/useAppStore';

export const useAppStateSync = () => {
  const { checkRollover } = useAppStore();

  useEffect(() => {
    checkRollover();
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        checkRollover();
      }
    });
    const interval = setInterval(checkRollover, 60000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [checkRollover]);
};
