import { LegacyEventEmitter, type EventSubscription, UnavailabilityError } from 'expo-modules-core';

import { Notification, NotificationResponse } from './Notifications.types';
import NotificationsEmitterModule from './NotificationsEmitterModule';
import { mapNotification, mapNotificationResponse } from './utils/mapNotificationResponse';

// Web uses SyntheticEventEmitter
const emitter = new LegacyEventEmitter(NotificationsEmitterModule);

const didReceiveNotificationEventName = 'onDidReceiveNotification';
const didDropNotificationsEventName = 'onNotificationsDeleted';
const didReceiveNotificationResponseEventName = 'onDidReceiveNotificationResponse';
const didClearNotificationResponseEventName = 'onDidClearNotificationResponse';

// @docsMissing
export const DEFAULT_ACTION_IDENTIFIER = 'expo.modules.notifications.actions.DEFAULT';

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
export function addNotificationReceivedListener(
  listener: (event: Notification) => void
): EventSubscription {
  return emitter.addListener<Notification>(
    didReceiveNotificationEventName,
    (notification: Notification) => {
      const mappedNotification = mapNotification(notification);
      listener(mappedNotification);
    }
  );
}

/**
 * Listeners registered by this method will be called whenever some notifications have been dropped by the server.
 * Applicable only to Firebase Cloud Messaging which we use as a notifications service on Android. It corresponds to `onDeletedMessages()` callback.
 * More information can be found in [Firebase docs](https://firebase.google.com/docs/cloud-messaging/android/receive#override-ondeletedmessages).
 * @param listener A callback function.
 * @return An [`EventSubscription`](#eventsubscription) object represents the subscription of the provided listener.
 * @header listen
 */
export function addNotificationsDroppedListener(listener: () => void): EventSubscription {
  return emitter.addListener<void>(didDropNotificationsEventName, listener);
}

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
export function addNotificationResponseReceivedListener(
  listener: (event: NotificationResponse) => void
): EventSubscription {
  return emitter.addListener<NotificationResponse>(
    didReceiveNotificationResponseEventName,
    (response: NotificationResponse) => {
      const mappedResponse = mapNotificationResponse(response);
      listener(mappedResponse);
    }
  );
}

/**
 * Removes a notification subscription returned by an `addNotificationListener` call.
 * @param subscription A subscription returned by `addNotificationListener` method.
 * @header listen
 */
export function removeNotificationSubscription(subscription: EventSubscription) {
  if (typeof subscription?.remove === 'function') {
    subscription.remove();
  } else {
    throw new Error(
      `removeNotificationSubscription: Provided value is not a subscription: ${subscription}`
    );
  }
}

/**
 * Gets the notification response that was received most recently
 * (a notification response designates an interaction with a notification, such as tapping on it).
 *
 * - `null` - if no notification response has been received yet
 * - a [`NotificationResponse`](#notificationresponse) object - if a notification response was received
 * - a [`NotificationResponse`](#notificationresponse) object - if a notification response was received.
 */
export async function getLastNotificationResponseAsync(): Promise<NotificationResponse | null> {
  if (!NotificationsEmitterModule.getLastNotificationResponseAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getLastNotificationResponseAsync');
  }
  const response = await NotificationsEmitterModule.getLastNotificationResponseAsync();
  const mappedResponse = response ? mapNotificationResponse(response) : response;
  return mappedResponse;
}

/* Clears the notification response that was received most recently. May be used
 * when an app selects a route based on the notification response, and it is undesirable
 * to continue selecting the route after the response has already been handled.
 *
 * If a component is using the [`useLastNotificationResponse`](#uselastnotificationresponse) hook,
 * this call will also clear the value returned by the hook.
 *
 * @return A promise that resolves if the native call was successful.
 */
export async function clearLastNotificationResponseAsync(): Promise<void> {
  if (!NotificationsEmitterModule.clearLastNotificationResponseAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'getLastNotificationResponseAsync');
  }
  await NotificationsEmitterModule.clearLastNotificationResponseAsync();
  // Emit event to clear any useLastNotificationResponse hooks, after native call succeeds
  emitter.emit(didClearNotificationResponseEventName, []);
}

/**
 * @hidden
 */
export function addNotificationResponseClearedListener(listener: () => void): EventSubscription {
  return emitter.addListener<void>(didClearNotificationResponseEventName, listener);
}
