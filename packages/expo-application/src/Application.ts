import { UnavailabilityError } from '@unimodules/core';

import ExpoApplication from './ExpoApplication';

export const nativeApplicationVersion: string | null = ExpoApplication
  ? ExpoApplication.nativeApplicationVersion || null
  : null;
export const nativeBuildVersion: string | null = ExpoApplication
  ? ExpoApplication.nativeBuildVersion || null
  : null;
export const applicationName: string | null = ExpoApplication
  ? ExpoApplication.applicationName || null
  : null;
export const applicationId: string | null = ExpoApplication
  ? ExpoApplication.applicationId || null
  : null;
export const androidId: string | null = ExpoApplication ? ExpoApplication.androidId || null : null;

export async function getInstallReferrerAsync(): Promise<string> {
  if (!ExpoApplication.getInstallReferrerAsync) {
    throw new UnavailabilityError('expo-application', 'getInstallReferrerAsync');
  }
  return await ExpoApplication.getInstallReferrerAsync();
}

export async function getIosIdForVendorAsync(): Promise<string> {
  if (!ExpoApplication.getIosIdForVendorAsync) {
    throw new UnavailabilityError('expo-application', 'getIosIdForVendorAsync');
  }
  return await ExpoApplication.getIosIdForVendorAsync();
}

export async function getInstallationTimeAsync(): Promise<Date> {
  if (!ExpoApplication.getInstallationTimeAsync) {
    throw new UnavailabilityError('expo-application', 'getInstallationTimeAsync');
  }
  let installationTime = await ExpoApplication.getInstallationTimeAsync();
  return new Date(installationTime);
}

export async function getLastUpdateTimeAsync(): Promise<Date> {
  if (!ExpoApplication.getLastUpdateTimeAsync) {
    throw new UnavailabilityError('expo-application', 'getLastUpdateTimeAsync');
  }
  let lastUpdateTime = await ExpoApplication.getLastUpdateTimeAsync();
  return new Date(lastUpdateTime);
}
