import { useEffect, useLayoutEffect, useState } from 'react';

import { NotificationResponse } from './Notifications.types';
import { addNotificationResponseReceivedListener } from './NotificationsEmitter';
import NotificationsEmitterModule from './NotificationsEmitterModule';

/**
 * Return value of this hook may be one of three types:
 * - `undefined` until we know what to return
 * - `null` until the app receives any notification response
 * - an object of `NotificationResponse` type - the response
 *   that has been received by the app most recently.
 */
export default function useLastNotificationResponse() {
  const [lastNotificationResponse, setLastNotificationResponse] = useState<
    NotificationResponse | null | undefined
  >(undefined);

  // useLayoutEffect ensures the listener is registered as soon as possible
  useLayoutEffect(() => {
    const subscription = addNotificationResponseReceivedListener((response) => {
      setLastNotificationResponse(response);
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
      setLastNotificationResponse((currentResponse) => currentResponse ?? response);
    });
  }, []);

  return lastNotificationResponse;
}
