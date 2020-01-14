import { EventEmitter, Subscription, Platform } from '@unimodules/core';
import { DevicePushToken } from './getDevicePushTokenAsync';
import PushTokenManager from './PushTokenManager';

export type TokenListener = (token: DevicePushToken) => void;

// Web uses SyntheticEventEmitter
const tokenEmitter = new EventEmitter(PushTokenManager);
const newTokenEventName = 'onDevicePushToken';

export function addTokenListener(listener: TokenListener): Subscription {
  const wrappingListener = ({ devicePushToken }) =>
    // @ts-ignore: TS can't decide what Platform.OS is.
    listener({ data: devicePushToken, type: Platform.OS });
  return tokenEmitter.addListener(newTokenEventName, wrappingListener);
}

export function removeTokenSubscription(subscription: Subscription) {
  tokenEmitter.removeSubscription(subscription);
}

export function removeAllTokenListeners() {
  tokenEmitter.removeAllListeners(newTokenEventName);
}
