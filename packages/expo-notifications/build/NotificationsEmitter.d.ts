import { type EventSubscription } from 'expo-modules-core';
import { Notification, NotificationResponse } from './Notifications.types';
export declare const DEFAULT_ACTION_IDENTIFIER = "expo.modules.notifications.actions.DEFAULT";
/**
 * Listeners registered by this method will be called whenever a notification is received while the app is running.
 * @param listener A function accepting a notification ([`Notification`](#notification)) as an argument.
 * @return An [`EventSubscription`](#eventsubscription) object represents the subscription of the provided listener.
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
export declare function addNotificationReceivedListener(listener: (event: Notification) => void): EventSubscription;
/**
 * Listeners registered by this method will be called whenever some notifications have been dropped by the server.
 * Applicable only to Firebase Cloud Messaging which we use as a notifications service on Android. It corresponds to `onDeletedMessages()` callback.
 * More information can be found in [Firebase docs](https://firebase.google.com/docs/cloud-messaging/android/receive#override-ondeletedmessages).
 * @param listener A callback function.
 * @return An [`EventSubscription`](#eventsubscription) object represents the subscription of the provided listener.
 * @header listen
 */
export declare function addNotificationsDroppedListener(listener: () => void): EventSubscription;
/**
 * Listeners registered by this method will be called whenever a user interacts with a notification (for example, taps on it).
 * @param listener A function accepting notification response ([`NotificationResponse`](#notificationresponse)) as an argument.
 * @return An [`EventSubscription`](#eventsubscription) object represents the subscription of the provided listener.
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
export declare function addNotificationResponseReceivedListener(listener: (event: NotificationResponse) => void): EventSubscription;
/**
 *
 * Gets the notification response received most recently
 * (a notification response designates an interaction with a notification, such as tapping on it).
 *
 * - `null` - if no notification response has been received yet
 * - a [`NotificationResponse`](#notificationresponse) object - if a notification response was received
 *
 * @deprecated Use `getLastNotificationResponse` instead.
 */
export declare function getLastNotificationResponseAsync(): Promise<NotificationResponse | null>;
/**
 * Gets the notification response that was received most recently
 * (a notification response designates an interaction with a notification, such as tapping on it).
 *
 * - `null` - if no notification response has been received yet
 * - a [`NotificationResponse`](#notificationresponse) object - if a notification response was received
 */
export declare function getLastNotificationResponse(): NotificationResponse | null;
/**
 * Clears the notification response that was received most recently. May be used
 * when an app selects a route based on the notification response, and it is undesirable
 * to continue selecting the route after the response has already been handled.
 *
 * If a component is using the [`useLastNotificationResponse`](#uselastnotificationresponse) hook,
 * this call will also clear the value returned by the hook.
 *
 * @deprecated Use `clearLastNotificationResponse` instead.
 * @return A promise that resolves if the native call was successful.
 */
export declare function clearLastNotificationResponseAsync(): Promise<void>;
/**
 * Clears the notification response that was received most recently. May be used
 * when an app selects a route based on the notification response, and it is undesirable
 * to continue selecting the route after the response has already been handled.
 *
 * If a component is using the [`useLastNotificationResponse`](#uselastnotificationresponse) hook,
 * this call will also clear the value returned by the hook.
 *
 */
export declare function clearLastNotificationResponse(): void;
/**
 * @hidden
 */
export declare function addNotificationResponseClearedListener(listener: () => void): EventSubscription;
//# sourceMappingURL=NotificationsEmitter.d.ts.map