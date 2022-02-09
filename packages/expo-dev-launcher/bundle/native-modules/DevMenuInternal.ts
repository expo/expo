import { NativeModules } from 'react-native';

const DevMenu = NativeModules.ExpoDevMenuInternal;

export type DevMenuSettingsType = Partial<{
  motionGestureEnabled: boolean;
  touchGestureEnabled: boolean;
  keyCommandsEnabled: boolean;
  showsAtLaunch: boolean;
}>;

export async function getSettingsAsync(): Promise<DevMenuSettingsType> {
  return DevMenu.getSettingsAsync();
}

export async function setSettingsAsync(settings: DevMenuSettingsType) {
  return await DevMenu.setSettingsAsync(settings);
}
