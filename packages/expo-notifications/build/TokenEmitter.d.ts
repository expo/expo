import { Subscription } from '@unimodules/core';
import { DevicePushToken } from './getDevicePushTokenAsync';
export declare type TokenListener = (token: DevicePushToken) => void;
export declare function addTokenListener(listener: TokenListener): Subscription;
export declare function removeTokenSubscription(subscription: Subscription): void;
export declare function removeAllTokenListeners(): void;
