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

export enum ApplicationReleaseType {
  UNKNOWN = 0,
  SIMULATOR = 1,
  ENTERPRISE = 2,
  DEVELOPMENT = 3,
  AD_HOC = 4,
  APP_STORE = 5,
}

export async function getIosApplicationReleaseTypeAsync(): Promise<ApplicationReleaseType> {
  if (!ExpoApplication.getApplicationReleaseTypeAsync) {
    throw new UnavailabilityError('expo-application', 'getApplicationReleaseTypeAsync');
  }
  return await ExpoApplication.getApplicationReleaseTypeAsync();
}

export async function getIosPushNotificationServiceEnvironmentAsync(): Promise<string> {
  if (!ExpoApplication.getPushNotificationServiceEnvironmentAsync) {
    throw new UnavailabilityError('expo-application', 'getPushNotificationServiceEnvironmentAsync');
  }
  return await ExpoApplication.getPushNotificationServiceEnvironmentAsync();
}

export async function getInstallationTimeAsync(): Promise<Date> {
  if (!ExpoApplication.getInstallationTimeAsync) {
    throw new UnavailabilityError('expo-application', 'getInstallationTimeAsync');
  }
  const installationTime = await ExpoApplication.getInstallationTimeAsync();
  return new Date(installationTime);
}

export async function getLastUpdateTimeAsync(): Promise<Date> {
  if (!ExpoApplication.getLastUpdateTimeAsync) {
    throw new UnavailabilityError('expo-application', 'getLastUpdateTimeAsync');
  }
  const lastUpdateTime = await ExpoApplication.getLastUpdateTimeAsync();
  return new Date(lastUpdateTime);
}
