import { NativeModules } from 'react-native';

export const DevMenu = NativeModules.ExpoDevMenu;

export function isDevMenuAvailable(): boolean {
  return !!DevMenu;
}
