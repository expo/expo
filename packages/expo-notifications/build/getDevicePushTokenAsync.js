import { UnavailabilityError, Platform, NativeModulesProxy } from '@unimodules/core';
const ExpoPushTokenManager = NativeModulesProxy.ExpoPushTokenManager;
export default async function getDevicePushTokenAsync() {
    if (!ExpoPushTokenManager.getDevicePushTokenAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'getDevicePushTokenAsync');
    }
    const devicePushToken = await ExpoPushTokenManager.getDevicePushTokenAsync();
    // @ts-ignore: TS thinks Platform.OS could be anything and can't decide what type is it
    return { type: Platform.OS, data: devicePushToken };
}
//# sourceMappingURL=getDevicePushTokenAsync.js.map