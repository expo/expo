import { Platform, UnavailabilityError } from '@unimodules/core';

import ExpoApplication from './ExpoApplication';

export const nativeAppVersion = ExpoApplication ? ExpoApplication.nativeAppVersion : null;
export const nativeBuildVersion = ExpoApplication ? ExpoApplication.nativeBuildVersion : null;
export const applicationName = ExpoApplication ? ExpoApplication.applicationName : null;
export const bundleId = ExpoApplication ? ExpoApplication.bundleId : null;
export let androidId;
if(Platform.OS === 'ios'){
  androidId = null;
}
else{
  androidId = ExpoApplication ? ExpoApplication.androidId : null;
}

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

export async function getFirstInstallTimeAsync(): Promise<Date> {
  if (!ExpoApplication.getFirstInstallTimeAsync) {
    throw new UnavailabilityError('expo-application', 'getFirstInstallTimeAsync');
  }
  let firstInstallTime = await ExpoApplication.getFirstInstallTimeAsync();
  return new Date(firstInstallTime);
}

export async function getLastUpdateTimeAsync(): Promise<Date> {
  if (!ExpoApplication.getLastUpdateTimeAsync) {
    throw new UnavailabilityError('expo-application', 'getLastUpdateTimeAsync');
  }
  let lastUpdateTime = await ExpoApplication.getLastUpdateTimeAsync();
  return new Date(lastUpdateTime);
}
