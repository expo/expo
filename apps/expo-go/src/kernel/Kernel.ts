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

export const sdkVersions: string = Array.isArray(NativeKernel.sdkVersions)
  ? NativeKernel.sdkVersions.join(',')
  : NativeKernel.sdkVersions;

export const sdkVersionsArray = Array.isArray(NativeKernel.sdkVersions)
  ? NativeKernel.sdkVersions
  : [NativeKernel.sdkVersions];

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

export function selectQRReader(): void {
  NativeKernel.selectQRReader();
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

export async function getLastCrashDate(): Promise<number | null> {
  return Number(await NativeKernel.getLastCrashDate());
}
