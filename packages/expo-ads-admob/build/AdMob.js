import { UnavailabilityError } from '@unimodules/core';
import ExpoAdsAdMob from './ExpoAdsAdMob';
/**
 * Returns whether the AdMob API is enabled on the current device. This does not check the native configuration.
 *
 * @returns Async `boolean`, indicating whether the AdMob API is available on the current device. Currently this resolves `true` on iOS and Android only.
 */
export async function isAvailableAsync() {
    return !!ExpoAdsAdMob.setTestDeviceIDAsync;
}
export async function setTestDeviceIDAsync(testDeviceID) {
    if (!ExpoAdsAdMob.setTestDeviceIDAsync) {
        throw new UnavailabilityError('expo-ads-admob', 'setTestDeviceIDAsync');
    }
    await ExpoAdsAdMob.setTestDeviceIDAsync(testDeviceID || '');
}
//# sourceMappingURL=AdMob.js.map