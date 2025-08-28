import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_STATE } from '../constants/storageKeys';
import { AppStateShape } from './types';

export const loadAppState = async (): Promise<AppStateShape | null> => {
  try {
    const raw = await AsyncStorage.getItem(APP_STATE);
    if (!raw) return null;
    return JSON.parse(raw) as AppStateShape;
  } catch (e) {
    console.warn('Failed to load app state', e);
    return null;
  }
};

export const saveAppState = async (state: AppStateShape): Promise<void> => {
  try {
    await AsyncStorage.setItem(APP_STATE, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save app state', e);
  }
};
