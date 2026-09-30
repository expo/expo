import { UnavailabilityError, Platform } from 'expo-modules-core';
import PushTokenManager from './PushTokenManager';
import { warnOfExpoGoPushUsage } from './warnOfExpoGoPushUsage';
let nativeTokenPromise = null;
/**
 * Returns a native FCM, APNs token or a [`PushSubscription` data](https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription)
 * that can be used with another push notification service.
 * @header fetch
 */
export async function getDevicePushTokenAsync() {
    if (!PushTokenManager.getDevicePushTokenAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'getDevicePushTokenAsync');
    }
    warnOfExpoGoPushUsage();
    if (!nativeTokenPromise) {
        // Share one in-flight native request; clear it once it settles so a rejection can be retried
        nativeTokenPromise = PushTokenManager.getDevicePushTokenAsync().finally(() => {
            nativeTokenPromise = null;
        });
    }
    const devicePushToken = await nativeTokenPromise;
    // @ts-ignore: TS thinks Platform.OS could be anything and can't decide what type is it
    return { type: Platform.OS, data: devicePushToken };
}
//# sourceMappingURL=getDevicePushTokenAsync.js.map