import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { NotificationResponse } from './Notifications.types';
import { getLastNotificationResponse } from './SharedNotificationResponseListener.fx';

// We know that the initial notification response happens
// between registering the listener in global scope of the app
// and execution of setTimeout(0)-d callback scheduled
// inside a "change to active" app state event listener.
//
// An approach that is simple enough and works well
// is to set the global value once we know that if there was
// an "initial notification response" it has already been emitted
// and is the "last notification response".

// Initial notification response holder
// The value changes:
//   `undefined` -> `NotificationResponse` if there is an initial notification response
//   `undefined` -> `null` if there was no initial notification response
// Both changes happen in the `dispatchSetInitialResponseAndClear`
let globalInitialNotificationResponse: NotificationResponse | undefined | null = undefined;

function dispatchSetInitialResponseAndClear() {
  // process.nextTick/requestAnimationFrame-like
  setTimeout(() => {
    // If there was an initial notification response,
    // fetch it from the shared listener, otherwise
    // let's define it as null.
    globalInitialNotificationResponse = getLastNotificationResponse() ?? null;
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
