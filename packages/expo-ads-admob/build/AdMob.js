import { UnavailabilityError } from '@unimodules/core';
import ExpoAdsAdMob from './ExpoAdsAdMob';
import ExpoAdsAdMobInterstitial from './ExpoAdsAdMobInterstitialManager';
import ExpoAdsAdMobRewarded from './ExpoAdsAdMobRewardedVideoAdManager';
let _testDeviceID = null;
export function _getTestDeviceID() {
    return _testDeviceID;
}
export async function setTestDeviceID(testDeviceID) {
    _testDeviceID = testDeviceID;
    if (ExpoAdsAdMob.setTestDeviceID) {
        return await ExpoAdsAdMob.setTestDeviceID(testDeviceID || '');
    }
    else if (ExpoAdsAdMobInterstitial.setTestDeviceID && ExpoAdsAdMobRewarded.setTestDeviceID) {
        await Promise.all([
            ExpoAdsAdMobInterstitial.setTestDeviceID(testDeviceID),
            ExpoAdsAdMobRewarded.setTestDeviceID(testDeviceID),
        ]);
    }
    else {
        throw new UnavailabilityError('expo-ads-admob', 'setTestDeviceID');
    }
}
//# sourceMappingURL=AdMob.js.map