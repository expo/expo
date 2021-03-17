import { NativeModules, DeviceEventEmitter, EventSubscription } from 'react-native';

export function isDevMenuAvailable(): boolean {
  return !!NativeModules.ExpoDevMenu;
}

export const DevMenu = NativeModules.ExpoDevMenu;

export function addUserLoginListener(callback: () => void): EventSubscription {
  return DeviceEventEmitter.addListener('expo.dev-menu.user-login', callback);
}

export function addUserLogoutListener(callback: () => void): EventSubscription {
  return DeviceEventEmitter.addListener('expo.dev-menu.user-logout', callback);
}

export async function queryMyProjectsAsync(): Promise<any> {
  return await DevMenu.queryMyProjectsAsync();
}

export async function queryDevSessionsAsync(): Promise<any> {
  return await DevMenu.queryDevSessionsAsync();
}

export async function isLoggedInAsync(): Promise<boolean> {
  return await DevMenu.isLoggedInAsync();
}

export async function openProfile() {
  DevMenu.openProfile();
}

export async function openMenu() {
  DevMenu.openMenu();
}

export async function openSettings() {
  DevMenu.openSettings();
}
