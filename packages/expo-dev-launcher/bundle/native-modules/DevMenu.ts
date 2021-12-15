import { NativeModules } from 'react-native';

import { DevSession } from '../types';

export function isDevMenuAvailable(): boolean {
  return !!NativeModules.ExpoDevMenu;
}

export const DevMenu = NativeModules.ExpoDevMenu;

export async function queryMyProjectsAsync(): Promise<any> {
  return await DevMenu.queryMyProjectsAsync();
}

export async function queryDevSessionsAsync(): Promise<DevSession[]> {
  const data = await DevMenu.queryDevSessionsAsync();

  try {
    return JSON.parse(data).data;
  } catch (err) {
    console.log({ err });
    return [];
  }
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
