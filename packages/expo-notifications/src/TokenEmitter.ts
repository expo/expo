import { EventEmitter, Subscription, Platform } from 'expo-modules-core';

import PushTokenManager from './PushTokenManager';
import { DevicePushToken } from './Tokens.types';

export type PushTokenListener = (token: DevicePushToken) => void;

// Web uses SyntheticEventEmitter
const tokenEmitter = new EventEmitter(PushTokenManager);
const newTokenEventName = 'onDevicePushToken';

export function addPushTokenListener(listener: PushTokenListener): Subscription {
  const wrappingListener = ({ devicePushToken }) =>
    // @ts-ignore: TS can't decide what Platform.OS is.
    listener({ data: devicePushToken, type: Platform.OS });
  return tokenEmitter.addListener(newTokenEventName, wrappingListener);
}

export function removePushTokenSubscription(subscription: Subscription) {
  tokenEmitter.removeSubscription(subscription);
}
