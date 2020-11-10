import { Subscription } from '@unimodules/core';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { NotificationResponse } from './Notifications.types';
import { addNotificationResponseReceivedListener } from './NotificationsEmitter';

// We know that the initial notification response happens
// between registering the listener in global scope of the app
// and execution of setTimeout(0)-d callback scheduled
// inside a "change to active" app state event listener.
//
// An approach that is simple enough and works well
// is to update the global value as soon as we get
// any notification response, but only if it happens
// early enough that we consider this an "initial"
// notification response. To ensure we don't use
// later responses as "initial" we clear the subscription
// as soon as we know that if there was an "initial" response
// it has already been emitted.

// Initial notification response holder
// The value changes:
//   `undefined` -> `NotificationResponse` if there is an initial notification response
//   `undefined` -> `null` if there was no initial notification response
// The first change happens inside the global listener,
// the second one in `dispatchSetInitialResponseAndClear`.
let globalInitialNotificationResponse: NotificationResponse | undefined | null = undefined;

// A subscription waiting for initial notification response event
let initialNotificationResponseSubscription: Subscription | null = addNotificationResponseReceivedListener(
  response => {
    // Update the value
    globalInitialNotificationResponse = response;
  }
);

function dispatchSetInitialResponseAndClear() {
  // process.nextTick/requestAnimationFrame-like
  setTimeout(() => {
    // If there was an initial notification response,
    // it is already defined, otherwise
    // let's define it as null.
    globalInitialNotificationResponse = globalInitialNotificationResponse ?? null;
    // We can now clear the global subscription
    if (initialNotificationResponseSubscription) {
      initialNotificationResponseSubscription.remove();
      initialNotificationResponseSubscription = null;
    }
    // We don't need to ever run this function again.
    AppState.removeEventListener('change', dispatchSetInitialResponseAndClear);
  }, 0);
}

AppState.addEventListener('change', dispatchSetInitialResponseAndClear);

/**
 * Returns an initial notification response if the app
 * was opened as a result of tapping on a notification,
 * null if the app doesn't seem to be opened as a result
 * of tapping on a notification, or undefined until we are sure
 * of which to return.
 */
export default function useInitialNotificationResponse() {
  const [initialNotificationResponse, setInitialNotificationResponse] = useState<
    NotificationResponse | null | undefined
  >(globalInitialNotificationResponse);

  useEffect(() => {
    // process.nextTick & requestAnimationFrame-like
    // Executes after dispatchSetInitialResponseAndClear's inner callback
    const timeoutId = setTimeout(() => {
      // Ensure the value is not undefined (if by this time
      // it's still undefined there was no "initial notification response").
      setInitialNotificationResponse(
        currentResponse => currentResponse ?? globalInitialNotificationResponse ?? null
      );
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return initialNotificationResponse;
}
