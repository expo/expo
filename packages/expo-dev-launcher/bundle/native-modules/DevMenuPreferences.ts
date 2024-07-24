import { requireNativeModule } from 'expo-modules-core';

const DevMenuPreferences = requireNativeModule('DevMenuPreferences');

export type DevMenuPreferencesType = Partial<{
  motionGestureEnabled: boolean;
  touchGestureEnabled: boolean;
  keyCommandsEnabled: boolean;
  showsAtLaunch: boolean;
}>;

export async function getMenuPreferencesAsync(): Promise<DevMenuPreferencesType> {
  return await DevMenuPreferences.getPreferencesAsync();
}

export async function setMenuPreferencesAsync(settings: DevMenuPreferencesType) {
  return await DevMenuPreferences.setPreferencesAsync(settings);
}
