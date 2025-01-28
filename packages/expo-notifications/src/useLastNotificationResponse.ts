import { useLayoutEffect, useState } from 'react';

import { MaybeNotificationResponse } from './Notifications.types';
import {
  addNotificationResponseReceivedListener,
  addNotificationResponseClearedListener,
  getLastNotificationResponseAsync,
} from './NotificationsEmitter';

/**
 * A React hook which returns the notification response that was received most recently
 * (a notification response designates an interaction with a notification, such as tapping on it).
 *
 * To clear the last notification response, use [`clearLastNotificationResponseAsync()`](#notificationsclearlastnotificationresponseasync).
 *
 * > If you don't want to use a hook, you can use `Notifications.getLastNotificationResponseAsync()` instead.
 *
 * @return The hook may return one of these three types/values:
 * - `undefined` - until we're sure of what to return,
 * - `null` - if no notification response has been received yet,
 * - a [`NotificationResponse`](#notificationresponse) object - if a notification response was received.
 *
 * @example
 * Responding to a notification tap by opening a URL that could be put into the notification's `data`
 * (opening the URL is your responsibility and is not a part of the `expo-notifications` API):
 * ```jsx
 * import * as Notifications from 'expo-notifications';
 * import { Linking } from 'react-native';
 *
 * export default function App() {
 *   const lastNotificationResponse = Notifications.useLastNotificationResponse();
 *   React.useEffect(() => {
 *     if (
 *       lastNotificationResponse &&
 *       lastNotificationResponse.notification.request.content.data.url &&
 *       lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
 *     ) {
 *       Linking.openURL(lastNotificationResponse.notification.request.content.data.url);
 *     }
 *   }, [lastNotificationResponse]);
 *   return (
 *     // Your app content
 *   );
 * }
 * ```
 * @header listen
 */
export default function useLastNotificationResponse() {
  const [lastNotificationResponse, setLastNotificationResponse] =
    useState<MaybeNotificationResponse>(undefined);

  // Pure function that returns the new response if it is different from the previous,
  // otherwise return the previous response
  const newResponseIfNeeded = (
    prevResponse: MaybeNotificationResponse,
    newResponse: MaybeNotificationResponse
  ) => {
    // If the new response is undefined or null, no need for update
    if (!newResponse) {
      return prevResponse;
    }
    // If the previous response is undefined or null and the new response is not, we should update
    if (!prevResponse) {
      return newResponse;
    }
    return prevResponse.notification.request.identifier !==
      newResponse.notification.request.identifier
      ? newResponse
      : prevResponse;
  };

  // useLayoutEffect ensures the listener is registered as soon as possible
  useLayoutEffect(() => {
    // Get the last response first, in case it was set earlier (even in native code on startup)
    // before this renders
    getLastNotificationResponseAsync?.().then((response) =>
      setLastNotificationResponse((prevResponse) => newResponseIfNeeded(prevResponse, response))
    );

    // Set up listener for responses that come in, and set the last response if needed
    const subscription = addNotificationResponseReceivedListener((response) =>
      setLastNotificationResponse((prevResponse) => newResponseIfNeeded(prevResponse, response))
    );
    const clearResponseSubscription = addNotificationResponseClearedListener(() => {
      setLastNotificationResponse(undefined);
    });
    return () => {
      subscription.remove();
      clearResponseSubscription.remove();
    };
  }, []);

  return lastNotificationResponse;
}
