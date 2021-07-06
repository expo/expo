import { NativeModules } from 'react-native';

const { ExpoDevMenu } = NativeModules;

export function openMenu(): void {
  ExpoDevMenu.openMenu();
}
