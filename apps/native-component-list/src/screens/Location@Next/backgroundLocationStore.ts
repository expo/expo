import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Position } from 'expo-location/next';

const STORAGE_KEY = 'LocationNext.backgroundFixes';
const MAX_ENTRIES = 200;

export type BackgroundFixEntry = {
  lat: number;
  lon: number;
  fixedAt: number;
  arrivedAt: number;
};

export async function getBackgroundFixesAsync(): Promise<BackgroundFixEntry[]> {
  try {
    const item = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = item ? JSON.parse(item) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// The task runs with no UI attached, and often in a process that is about to be killed, so the
// fixes have to reach disk. React state cannot hold them.
export async function appendBackgroundFixAsync(position: Position): Promise<void> {
  const entry: BackgroundFixEntry = {
    lat: position.coordinates.latitude,
    lon: position.coordinates.longitude,
    fixedAt: position.timestamp,
    arrivedAt: Date.now(),
  };
  const saved = await getBackgroundFixesAsync();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...saved].slice(0, MAX_ENTRIES)));
}

export async function clearBackgroundFixesAsync(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
