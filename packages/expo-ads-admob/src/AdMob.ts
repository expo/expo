import { UnavailabilityError } from '@unimodules/core';

import ExpoAdsAdMob from './ExpoAdsAdMob';

export async function setTestDeviceIDAsync(testDeviceID: string | null): Promise<void> {
  if (!ExpoAdsAdMob.setTestDeviceIDAsync) {
    throw new UnavailabilityError('expo-ads-admob', 'setTestDeviceIDAsync');
  }
  await ExpoAdsAdMob.setTestDeviceIDAsync(testDeviceID || '');
}
