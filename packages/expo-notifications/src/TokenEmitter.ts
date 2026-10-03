import { type EventSubscription, Platform } from 'expo';

import PushTokenManager from './PushTokenManager';
import type { DevicePushToken } from './Tokens.types';
import { warnOfExpoGoPushUsage } from './warnOfExpoGoPushUsage';

/**
 * A function accepting a device push token ([`DevicePushToken`](#devicepushtoken)) as an argument.
 * > **Note:** You should not call `getDevicePushTokenAsync` inside this function, as it triggers the listener and may lead to an infinite loop.
 * @header fetch
 */
export type PushTokenListener = (token: DevicePushToken) => void;

// Web uses SyntheticEventEmitter
const newTokenEventName = 'onDevicePushToken';

/**
 * In rare situations, a push token may be changed by the push notification service while the app is running.
 * When a token is rolled, the old one becomes invalid and sending notifications to it will fail.
 * A push token listener will let you handle this situation gracefully by registering the new token with your backend right away.
 * On Android, the listener is also called after every successful `getDevicePushTokenAsync()` call, even when the token
 * returned is the same as before. If your listener sends the token to a server, compare it with the token you already
 * stored before writing, otherwise a repeated fetch will cause a write on every call.
 * @param listener A function accepting a push token as an argument, it will be called whenever the push token changes and, on Android, after every `getDevicePushTokenAsync()` call.
 * @return An [`EventSubscription`](#eventsubscription) object represents the subscription of the provided listener.
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
export function addPushTokenListener(listener: PushTokenListener): EventSubscription {
  warnOfExpoGoPushUsage();
  return PushTokenManager.addListener(newTokenEventName, ({ devicePushToken }) =>
    listener({ data: devicePushToken, type: Platform.OS })
  );
}
