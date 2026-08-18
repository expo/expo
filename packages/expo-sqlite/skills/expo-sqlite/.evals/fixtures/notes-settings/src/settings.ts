import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
}

const SETTINGS_KEY = 'settings';

export async function loadSettingsAsync(): Promise<Settings | null> {
  const value = await AsyncStorage.getItem(SETTINGS_KEY);
  return value ? (JSON.parse(value) as Settings) : null;
}

export async function saveSettingsAsync(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function clearSettingsAsync(): Promise<void> {
  await AsyncStorage.removeItem(SETTINGS_KEY);
}
