import { UnavailabilityError, Platform } from 'expo-modules-core';
import PushTokenManager from './PushTokenManager';
let nativeTokenPromise = null;
export default async function getDevicePushTokenAsync() {
    if (!PushTokenManager.getDevicePushTokenAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'getDevicePushTokenAsync');
    }
    let devicePushToken = null;
    if (nativeTokenPromise) {
        // Reuse existing Promise
        devicePushToken = await nativeTokenPromise;
    }
    else {
        // Create a new Promise and clear it afterwards
        nativeTokenPromise = PushTokenManager.getDevicePushTokenAsync();
        devicePushToken = await nativeTokenPromise;
        nativeTokenPromise = null;
    }
    // @ts-ignore: TS thinks Platform.OS could be anything and can't decide what type is it
    return { type: Platform.OS, data: devicePushToken };
}
//# sourceMappingURL=getDevicePushTokenAsync.js.map