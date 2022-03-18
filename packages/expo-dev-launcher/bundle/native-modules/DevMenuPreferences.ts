import { NativeModules } from 'react-native';

const DevMenuPreferences = NativeModules.DevMenuPreferences;

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
