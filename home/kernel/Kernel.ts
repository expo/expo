import { NativeModules } from 'react-native';

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

export const iosClientReleaseType: ExpoClientReleaseType =
  NativeKernel.IOSClientReleaseType || ExpoClientReleaseType.UNKNOWN;

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
