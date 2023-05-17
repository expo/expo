import { requireNativeModule } from 'expo-modules-core';
import { NativeModules, Platform } from 'react-native';

const DevMenuPreferences =
  Platform.OS === 'ios'
    ? requireNativeModule('DevMenuPreferences')
    : NativeModules.DevMenuPreferences;

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
