import { Subscription } from 'expo-modules-core';
import { DevicePushToken } from './Tokens.types';
/**
 * A function accepting a device push token ([`DevicePushToken`](#devicepushtoken)) as an argument.
 * > **Note:** You should not call `getDevicePushTokenAsync` inside this function, as it triggers the listener and may lead to an infinite loop.
 * @header fetch
 */
export type PushTokenListener = (token: DevicePushToken) => void;
/**
 * In rare situations, a push token may be changed by the push notification service while the app is running.
 * When a token is rolled, the old one becomes invalid and sending notifications to it will fail.
 * A push token listener will let you handle this situation gracefully by registering the new token with your backend right away.
 * @param listener A function accepting a push token as an argument, it will be called whenever the push token changes.
 * @return A [`Subscription`](#subscription) object represents the subscription of the provided listener.
 * @header fetch
 * @example Registering a push token listener using a React hook.
 * ```jsx
 * import React from 'react';
 * import * as Notifications from 'expo-notifications';
 *
 * import { registerDevicePushTokenAsync } from '../api';
 *
 * export default function App() {
 *   React.useEffect(() => {
 *     const subscription = Notifications.addPushTokenListener(registerDevicePushTokenAsync);
 *     return () => subscription.remove();
 *   }, []);
 *
 *   return (
 *     // Your app content
 *   );
 * }
 * ```
 */
export declare function addPushTokenListener(listener: PushTokenListener): Subscription;
/**
 * Removes a push token subscription returned by an `addPushTokenListener` call.
 * @param subscription A subscription returned by `addPushTokenListener` method.
 * @header fetch
 */
export declare function removePushTokenSubscription(subscription: Subscription): void;
//# sourceMappingURL=TokenEmitter.d.ts.map