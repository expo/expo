import { EventEmitter, UnavailabilityError } from 'expo-modules-core';
import NotificationsEmitterModule from './NotificationsEmitterModule';
import { mapNotificationResponse } from './utils/mapNotificationResponse';
// Web uses SyntheticEventEmitter
const emitter = new EventEmitter(NotificationsEmitterModule);
const didReceiveNotificationEventName = 'onDidReceiveNotification';
const didDropNotificationsEventName = 'onNotificationsDeleted';
const didReceiveNotificationResponseEventName = 'onDidReceiveNotificationResponse';
// @docsMissing
export const DEFAULT_ACTION_IDENTIFIER = 'expo.modules.notifications.actions.DEFAULT';
/**
 * Listeners registered by this method will be called whenever a notification is received while the app is running.
 * @param listener A function accepting a notification ([`Notification`](#notification)) as an argument.
 * @return A [`Subscription`](#subscription) object represents the subscription of the provided listener.
 * @example Registering a notification listener using a React hook:
 * ```jsx
 * import React from 'react';
 * import * as Notifications from 'expo-notifications';
 *
 * export default function App() {
 *   React.useEffect(() => {
 *     const subscription = Notifications.addNotificationReceivedListener(notification => {
 *       console.log(notification);
 *     });
 *     return () => subscription.remove();
 *   }, []);
 *
 *   return (
 *     // Your app content
 *   );
 * }
 * ```
 * @header listen
 */
export function addNotificationReceivedListener(listener) {
    return emitter.addListener(didReceiveNotificationEventName, listener);
}
/**
 * Listeners registered by this method will be called whenever some notifications have been dropped by the server.
 * Applicable only to Firebase Cloud Messaging which we use as a notifications service on Android. It corresponds to `onDeletedMessages()` callback.
 * More information can be found in [Firebase docs](https://firebase.google.com/docs/cloud-messaging/android/receive#override-ondeletedmessages).
 * @param listener A callback function.
 * @return A [`Subscription`](#subscription) object represents the subscription of the provided listener.
 * @header listen
 */
export function addNotificationsDroppedListener(listener) {
    return emitter.addListener(didDropNotificationsEventName, listener);
}
/**
 * Listeners registered by this method will be called whenever a user interacts with a notification (for example, taps on it).
 * @param listener A function accepting notification response ([`NotificationResponse`](#notificationresponse)) as an argument.
 * @return A [`Subscription`](#subscription) object represents the subscription of the provided listener.
 * @example Register a notification responder listener:
 * ```jsx
 * import React from 'react';
 * import { Linking } from 'react-native';
 * import * as Notifications from 'expo-notifications';
 *
 * export default function Container() {
 *   React.useEffect(() => {
 *     const subscription = Notifications.addNotificationResponseReceivedListener(response => {
 *       const url = response.notification.request.content.data.url;
 *       Linking.openURL(url);
 *     });
 *     return () => subscription.remove();
 *   }, []);
 *
 *   return (
 *     // Your app content
 *   );
 * }
 * ```
 * @header listen
 */
export function addNotificationResponseReceivedListener(listener) {
    return emitter.addListener(didReceiveNotificationResponseEventName, (response) => {
        const mappedResponse = mapNotificationResponse(response);
        listener(mappedResponse);
    });
}
/**
 * Removes a notification subscription returned by an `addNotificationListener` call.
 * @param subscription A subscription returned by `addNotificationListener` method.
 * @header listen
 */
export function removeNotificationSubscription(subscription) {
    emitter.removeSubscription(subscription);
}
// @docsMissing
/**
 * @header listen
 */
export async function getLastNotificationResponseAsync() {
    if (!NotificationsEmitterModule.getLastNotificationResponseAsync) {
        throw new UnavailabilityError('ExpoNotifications', 'getLastNotificationResponseAsync');
    }
    return await NotificationsEmitterModule.getLastNotificationResponseAsync();
}
//# sourceMappingURL=NotificationsEmitter.js.map