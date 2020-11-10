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
    const subscription = addNotificationResponseReceivedListener(response => {
      setLastNotificationResponse(response);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return lastNotificationResponse;
}
