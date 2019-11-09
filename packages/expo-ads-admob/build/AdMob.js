import { UnavailabilityError } from '@unimodules/core';
import ExpoAdsAdMob from './ExpoAdsAdMob';
export async function setTestDeviceIDAsync(testDeviceID) {
    if (!ExpoAdsAdMob.setTestDeviceIDAsync) {
        throw new UnavailabilityError('expo-ads-admob', 'setTestDeviceIDAsync');
    }
    await ExpoAdsAdMob.setTestDeviceIDAsync(testDeviceID || '');
}
//# sourceMappingURL=AdMob.js.map