import { Subscription } from 'expo-modules-core';
import { DevicePushToken } from './Tokens.types';
export declare type PushTokenListener = (token: DevicePushToken) => void;
export declare function addPushTokenListener(listener: PushTokenListener): Subscription;
export declare function removePushTokenSubscription(subscription: Subscription): void;
//# sourceMappingURL=TokenEmitter.d.ts.map