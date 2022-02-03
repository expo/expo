import { NativeModules, Platform } from 'react-native';

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

export async function setSessionAsync(
  session: { [key: string]: any; sessionSecret: string } | null
): Promise<void> {
  return await DevMenu.setSessionAsync(session);
}

export async function restoreSessionAsync(): Promise<{
  [key: string]: any;
  sessionSecret: string;
}> {
  if (Platform.OS === 'android') {
    try {
      return JSON.parse(await DevMenu.restoreSessionAsync());
    } catch (exception) {
      return null;
    }
  }
  return await DevMenu.restoreSessionAsync();
}

export async function getAuthSchemeAsync(): Promise<string> {
  if (Platform.OS === 'android') {
    return 'expo-dev-launcher';
  }

  return await DevMenu.getAuthSchemeAsync();
}
