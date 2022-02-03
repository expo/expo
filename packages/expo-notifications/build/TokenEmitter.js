import { EventEmitter, Platform } from 'expo-modules-core';
import PushTokenManager from './PushTokenManager';
// Web uses SyntheticEventEmitter
const tokenEmitter = new EventEmitter(PushTokenManager);
const newTokenEventName = 'onDevicePushToken';
export function addPushTokenListener(listener) {
    const wrappingListener = ({ devicePushToken }) => 
    // @ts-ignore: TS can't decide what Platform.OS is.
    listener({ data: devicePushToken, type: Platform.OS });
    return tokenEmitter.addListener(newTokenEventName, wrappingListener);
}
export function removePushTokenSubscription(subscription) {
    tokenEmitter.removeSubscription(subscription);
}
//# sourceMappingURL=TokenEmitter.js.map