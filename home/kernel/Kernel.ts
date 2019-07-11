import { Linking, NativeModules } from 'react-native';

import MockKernel from './MockKernel';

const NativeKernel = NativeModules.ExponentKernel || MockKernel;

export enum ExpoClientReleaseType {
  UNKNOWN = 'UNKNOWN',
  SIMULATOR = 'SIMULATOR',
  ENTERPRISE = 'ENTERPRISE',
  DEVELOPMENT = 'DEVELOPMENT',
  AD_HOC = 'ADHOC',
  APPLE_APP_STORE = 'APPLE_APP_STORE',
}

export const sdkVersions: string[] = NativeKernel.sdkVersions;

export const iosClientReleaseType: ExpoClientReleaseType =
  NativeKernel.IOSClientReleaseType || ExpoClientReleaseType.UNKNOWN;

export async function openURLAsync(url: string): Promise<void> {
  // ExponentKernel.openURL exists on iOS, and it's the same as Linking.openURL except it will never
  // validate whether Expo can open this URL. This addresses cases where, e.g., someone types in a
  // http://localhost URL directly into the URL bar. We know they implicitly expect Expo to open
  // this, even though it won't validate as an Expo URL. By contrast, Linking.openURL would pass
  // such a URL on to the system URL handler.
  if (NativeKernel.openURL) {
    await NativeKernel.openURL(url);
  } else {
    await Linking.openURL(url);
  }
}

export type KernelDevMenuItem = {
  label: string;
  isEnabled: boolean;
  detail?: string;
};

export async function doesCurrentTaskEnableDevtoolsAsync(): Promise<boolean> {
  return await NativeKernel.doesCurrentTaskEnableDevtools();
}

export function addDevMenu(): void {
  NativeKernel.addDevMenu();
}

export async function getDevMenuItemsToShowAsync(): Promise<{ [key: string]: KernelDevMenuItem }> {
  return await NativeKernel.getDevMenuItemsToShow();
}

export function selectDevMenuItemWithKey(key: string): void {
  NativeKernel.selectDevMenuItemWithKey(key);
}

export function selectRefresh(): void {
  NativeKernel.selectRefresh();
}

export function selectCloseMenu(): void {
  NativeKernel.selectCloseMenu();
}

export function selectGoToHome(): void {
  NativeKernel.selectGoToHome();
}

export function selectQRReader(): void {
  NativeKernel.selectQRReader();
}

export async function setLegacyMenuBehaviorEnabledAsync(enabled: boolean): Promise<void> {
  await NativeKernel.setIsLegacyMenuBehaviorEnabledAsync(enabled);
}

export async function isNuxFinishedAsync(): Promise<boolean> {
  return await NativeKernel.getIsNuxFinishedAsync();
}

export async function setNuxFinishedAsync(finished: boolean): Promise<void> {
  await NativeKernel.setIsNuxFinishedAsync(finished);
}

export type KernelSession = {
  sessionSecret: string;
};

export async function getSessionAsync(): Promise<KernelSession | null> {
  return await NativeKernel.getSessionAsync();
}

export async function setSessionAsync(session: KernelSession): Promise<void> {
  await NativeKernel.setSessionAsync(session);
}

export async function removeSessionAsync(): Promise<void> {
  await NativeKernel.removeSessionAsync();
}

export function onEventSuccess(eventId: string, result: object): void {
  NativeKernel.onEventSuccess(eventId, result);
}

export function onEventFailure(eventId: string, message: string): void {
  NativeKernel.onEventFailure(eventId, message);
}
