import { EventEmitter, Platform } from '@unimodules/core';
import PushTokenManager from './PushTokenManager';
// Web uses SyntheticEventEmitter
const tokenEmitter = new EventEmitter(PushTokenManager);
const newTokenEventName = 'onDevicePushToken';
export function addTokenListener(listener) {
    const wrappingListener = ({ devicePushToken }) => 
    // @ts-ignore: TS can't decide what Platform.OS is.
    listener({ data: devicePushToken, type: Platform.OS });
    return tokenEmitter.addListener(newTokenEventName, wrappingListener);
}
export function removeTokenSubscription(subscription) {
    tokenEmitter.removeSubscription(subscription);
}
export function removeAllTokenListeners() {
    tokenEmitter.removeAllListeners(newTokenEventName);
}
//# sourceMappingURL=TokenEmitter.js.map