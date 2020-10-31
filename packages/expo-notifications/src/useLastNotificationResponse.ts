import { useEffect, useLayoutEffect, useState } from 'react';

import { NotificationResponse } from './Notifications.types';
import {
  addListener as addSharedResponseListener,
  getLastNotificationResponse,
} from './SharedNotificationResponseListener.fx';
import useInitialNotificationResponse from './useInitialNotificationResponse';

/**
 * Return value of this hook may be one of three types:
 * - `undefined` if the hook is rendered so early during
 *   the start of the app that we don't know yet
 *   whether there has been any notification response.
 * - `null` until the app receives any notification response
 * - an object of `NotificationResponse` type - the response
 *   that has been received by the app most recently.
 */
export default function useLastNotificationResponse() {
  // When considering how to implement this hook we need to think
  // about three moments of mounting the hook (after mounting
  // the shared response subscription will take care of updating the value):
  // 1. At the immediate start of the app, before initial notification
  //    response information is defined in JS (before the moment we believe
  //    is the last moment that the initial notification response could
  //    be delivered).
  // 2. After that (while the app is running).
  //
  // In the first situation the return value should go like:
  //     undefined -> null | NotificationResponse
  // - we ensure we start off with `undefined` thanks to
  //   `getLastNotificationResponse() ?? initialNotificationResponse`
  //   which will evaluate to `undefined ?? undefined`
  // - we ensure that if no initial notification response will be delivered
  //   (useInitialNotificationResponse() returns null)
  //   we update our value to null too (see last useEffect)
  // - we ensure we catch any future responses by adding
  //   a shared response listener (useLayout hook)
  //
  // In the second situation the return value should go like:
  //     null | NotificationResponse -> NotificationResponse
  // - we ensure we start off with `null` (if no notification response
  //   has occured) thanks to initial value of
  //   `getLastNotificationResponse() ?? initialNotificationResponse`
  //   which evalutes to `undefined ?? null`
  // - we ensure we start off with last notification response
  //   thanks to `getLastNotificationResponse()` which will return
  //   latest notification response
  // - we ensure we catch any future responses by adding
  //   a shared response listener (useLayout hook)
  const initialNotificationResponse = useInitialNotificationResponse();

  const [lastNotificationResponse, setLastNotificationResponse] = useState<
    NotificationResponse | null | undefined
  >(
    // getLastNotificationResponse() is only NotificationResponse | undefined
    // while initialNotificationResponse can be null, meaning there was no
    // initial notification response. By using ?? here we ensure we fallback
    // to a more defined, null value.
    getLastNotificationResponse() ?? initialNotificationResponse
  );

  // useLayoutEffect ensures the listener is registered as soon as possible
  useLayoutEffect(() => {
    const subscription = addSharedResponseListener(response => {
      setLastNotificationResponse(response);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // If this hook is mounted very early, i.e. before
  // useInitialNotificationResponse returns a defined value,
  // lastNotificationResponse is undefined and
  // we want to update its value as soon as we can.
  useEffect(() => {
    if (lastNotificationResponse === undefined) {
      setLastNotificationResponse(initialNotificationResponse);
    }
  }, [lastNotificationResponse, initialNotificationResponse]);

  return lastNotificationResponse;
}
