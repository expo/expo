import { UnavailabilityError } from '@unimodules/core';
import ExpoAdsAdMob from './ExpoAdsAdMob';
import ExpoAdsAdMobInterstitial from './ExpoAdsAdMobInterstitialManager';
import ExpoAdsAdMobRewarded from './ExpoAdsAdMobRewardedVideoAdManager';

let _testDeviceID: string | null = null;
export function _getTestDeviceID(): string | null {
  return _testDeviceID;
}

export async function setTestDeviceID(testDeviceID: string | null): Promise<void> {
  _testDeviceID = testDeviceID;
  if (ExpoAdsAdMob.setTestDeviceID) {
    return await ExpoAdsAdMob.setTestDeviceID(testDeviceID || '');
  } else if (ExpoAdsAdMobInterstitial.setTestDeviceID && ExpoAdsAdMobRewarded.setTestDeviceID) {
    await Promise.all([
      ExpoAdsAdMobInterstitial.setTestDeviceID(testDeviceID),
      ExpoAdsAdMobRewarded.setTestDeviceID(testDeviceID),
    ]);
  } else {
    throw new UnavailabilityError('expo-ads-admob', 'setTestDeviceID');
  }
}
