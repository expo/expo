import { useEffect, useLayoutEffect, useState } from 'react';

import { NotificationResponse } from './Notifications.types';
import { addNotificationResponseReceivedListener } from './NotificationsEmitter';
import NotificationsEmitterModule from './NotificationsEmitterModule';
import { mapNotificationResponse } from './utils/mapNotificationResponse';

/**
 * A React hook always returns the notification response that was received most recently
 * (a notification response designates an interaction with a notification, such as tapping on it).
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
  const [lastNotificationResponse, setLastNotificationResponse] = useState<
    NotificationResponse | null | undefined
  >(undefined);

  // useLayoutEffect ensures the listener is registered as soon as possible
  useLayoutEffect(() => {
    const subscription = addNotificationResponseReceivedListener((response) => {
      const mappedResponse = mapNotificationResponse(response);
      setLastNotificationResponse(mappedResponse);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // On each mount of this hook we fetch last notification response
  // from the native module which is an "always active listener"
  // and always returns the most recent response.
  useEffect(() => {
    NotificationsEmitterModule.getLastNotificationResponseAsync?.().then((response) => {
      // We only update the state with the resolved value if it's empty,
      // because if it's not empty it must have been populated by the `useLayoutEffect`
      // listener which returns "live" values.
      const mappedResponse = response ? mapNotificationResponse(response) : response;
      setLastNotificationResponse((currentResponse) => currentResponse ?? mappedResponse);
    });
  }, []);

  return lastNotificationResponse;
}
