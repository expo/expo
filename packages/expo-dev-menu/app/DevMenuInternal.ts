import { DeviceEventEmitter, NativeModules, EventSubscription } from 'react-native';

const DevMenu = NativeModules.ExpoDevMenuInternal;

export type DevMenuAppInfoType = {
  appName: string;
  appVersion: string;
  appIcon?: string;
  hostUrl?: string;
  expoSdkVersion?: string;
};

export enum DevMenuItemEnum {
  ACTION = 1,
  GROUP = 2,
}

type DevMenuItemBaseType<T extends DevMenuItemEnum> = {
  type: T;
  isAvailable: boolean;
  isEnabled: boolean;
  label: string;
  detail?: string | null;
  glyphName?: string | null;
};

export type DevMenuItemActionType = DevMenuItemBaseType<DevMenuItemEnum.ACTION> & {
  actionId: string;
  keyCommand: DevMenuKeyCommand;
};

export type DevMenuItemGroupType = DevMenuItemBaseType<DevMenuItemEnum.GROUP> & {
  groupName: string | null;
  items: DevMenuItemAnyType[];
};

export type DevMenuItemAnyType = DevMenuItemActionType | DevMenuItemGroupType;

export type DevMenuSettingsType = Partial<{
  motionGestureEnabled: boolean;
  touchGestureEnabled: boolean;
  keyCommandsEnabled: boolean;
  showsAtLaunch: boolean;
}>;

export type DevMenuKeyCommand = null | {
  input: string;
  modifiers: DevMenuKeyCommandsEnum;
};

// These options represent iOS `UIKeyModifierFlags`.
export enum DevMenuKeyCommandsEnum {
  CONTROL = 262144,
  COMMAND = 1048576,
  ALT = 524288,
  SHIFT = 131072,
}

export const doesDeviceSupportKeyCommands = DevMenu.isDeviceSupportsKeyCommands;

export async function dispatchActionAsync(actionId: string): Promise<void> {
  return await DevMenu.dispatchActionAsync(actionId);
}

export function hideMenu(): void {
  DevMenu.hideMenu();
}

export function setOnboardingFinished(finished: boolean): void {
  DevMenu.setOnboardingFinished(finished);
}

export async function getSettingsAsync(): Promise<DevMenuSettingsType> {
  return await DevMenu.getSettingsAsync();
}

export async function setSettingsAsync(settings: DevMenuSettingsType) {
  return await DevMenu.setSettingsAsync(settings);
}

export function subscribeToCloseEvents(listener: () => void): EventSubscription {
  return DeviceEventEmitter.addListener('closeDevMenu', listener);
}

export async function loadFontsAsync(): Promise<void> {
  return await DevMenu.loadFontsAsync();
}
