import { EventEmitter, Platform } from 'expo-modules-core';
import PushTokenManager from './PushTokenManager';
// Web uses SyntheticEventEmitter
const tokenEmitter = new EventEmitter(PushTokenManager);
const newTokenEventName = 'onDevicePushToken';
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
export function addPushTokenListener(listener) {
    const wrappingListener = ({ devicePushToken }) => listener({ data: devicePushToken, type: Platform.OS });
    return tokenEmitter.addListener(newTokenEventName, wrappingListener);
}
/**
 * Removes a push token subscription returned by an `addPushTokenListener` call.
 * @param subscription A subscription returned by `addPushTokenListener` method.
 * @header fetch
 */
export function removePushTokenSubscription(subscription) {
    tokenEmitter.removeSubscription(subscription);
}
//# sourceMappingURL=TokenEmitter.js.map