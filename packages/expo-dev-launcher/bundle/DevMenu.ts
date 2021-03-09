import { NativeModules } from 'react-native';

export function isDevMenuAvailable(): boolean {
  return !!NativeModules.ExpoDevMenu;
}

export const DevMenu = NativeModules.ExpoDevMenu;
