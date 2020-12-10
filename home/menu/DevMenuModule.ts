import { NativeModules, EventSubscription } from 'react-native';

import MockKernel from '../kernel/MockKernel';
import addListenerWithNativeCallback from '../utils/addListenerWithNativeCallback';

const NativeKernel = NativeModules.ExponentKernel || MockKernel;

export type DevMenuSettings = {
  motionGestureEnabled?: boolean;
  touchGestureEnabled?: boolean;
};

export type DevMenuItem = {
  label: string;
  isEnabled: boolean;
  detail?: string;
};

export async function getSettingsAsync(): Promise<DevMenuSettings | null> {
  if (!NativeKernel.getDevMenuSettingsAsync) {
    return null;
  }
  return await NativeKernel.getDevMenuSettingsAsync();
}

export async function setSettingAsync(key: keyof DevMenuSettings, value?: boolean): Promise<void> {
  await NativeKernel.setDevMenuSettingAsync(key, value);
}

export async function doesCurrentTaskEnableDevtoolsAsync(): Promise<boolean> {
  return await NativeKernel.doesCurrentTaskEnableDevtoolsAsync();
}

export async function closeAsync(): Promise<void> {
  return await NativeKernel.closeDevMenuAsync();
}

export async function getItemsToShowAsync(): Promise<{ [key: string]: DevMenuItem }> {
  return await NativeKernel.getDevMenuItemsToShowAsync();
}

export async function isOnboardingFinishedAsync(): Promise<boolean> {
  return await NativeKernel.getIsOnboardingFinishedAsync();
}

export async function setOnboardingFinishedAsync(finished: boolean): Promise<void> {
  await NativeKernel.setIsOnboardingFinishedAsync(finished);
}

export async function selectItemWithKeyAsync(key: string): Promise<void> {
  await NativeKernel.selectDevMenuItemWithKeyAsync(key);
}

export async function reloadAppAsync(): Promise<void> {
  await NativeKernel.reloadAppAsync();
}

export async function goToHomeAsync(): Promise<void> {
  await NativeKernel.goToHomeAsync();
}

export function listenForCloseRequests(listener: (event: any) => Promise<any>): EventSubscription {
  return addListenerWithNativeCallback('ExponentKernel.requestToCloseDevMenu', listener);
}
