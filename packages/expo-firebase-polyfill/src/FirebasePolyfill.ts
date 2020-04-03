import { Platform } from 'react-native';

import { btoa, atob } from './Base64';
import { getRandomValues } from './Crypto';

// Polyfill `btoa`
// @ts-ignore
if (!global.btoa) {
  // @ts-ignore
  global.btoa = btoa;
}

// Polyfill `atob`
// @ts-ignore
if (!global.atob) {
  // @ts-ignore
  global.atob = atob;
}

// Polyfill `Crypto.getRandomValues`
// @ts-ignore
if (!global.crypto || !global.crypto.getRandomValues) {
  // @ts-ignore
  global.crypto = global.crypto || {};
  // @ts-ignore
  global.crypto.getRandomValues = getRandomValues;
}

// Firebase schedules timers with excessive timeouts. On Android this leads
// to unnecessary battery drain by keeping the phone awake. React-native
// warns for this by throwing the "Setting a timer for a long period of time.."
// warning. To mitigate this problem, all timers are capped to 1 minute.
if (Platform.OS === 'android') {
  if (__DEV__) {
    console.info(
      `All setTimeout calls are capped to 60000 milliseconds (see https://github.com/expo/expo/tree/master/packages/expo-firebase-polyfill/)`
    );
  }
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (callback, timeout) => {
    timeout = Math.min(60000, timeout);
    return originalSetTimeout(callback, timeout);
  };
}
