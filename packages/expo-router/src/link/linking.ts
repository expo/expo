import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { parsePathAndParamsFromExpoGoLink } from '../fork/extractPathFromURL';
import getPathFromState from '../fork/getPathFromState';
import getStateFromPath from '../fork/getStateFromPath';

const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;

function getInitialURLWithTimeout(): Promise<string | null> {
  return Promise.race([
    Linking.getInitialURL(),
    new Promise<null>((resolve) =>
      // Timeout in 150ms if `getInitialState` doesn't resolve
      // Workaround for https://github.com/facebook/react-native/issues/25675
      setTimeout(() => resolve(null), 150)
    ),
  ]);
}

// A custom getInitialURL is used on native to ensure the app always starts at
// the root path if it's launched from something other than a deep link.
// This helps keep the native functionality working like the web functionality.
// For example, if you had a root navigator where the first screen was `/settings` and the second was `/index`
// then `/index` would be used on web and `/settings` would be used on native.
export function getInitialURL(): Promise<string | null> | string {
  if (process.env.NODE_ENV === 'test') {
    return Linking.getInitialURL() ?? getRootURL();
  }

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return '';
    } else if (window.location?.href) {
      return window.location.href;
    }
  }

  return getInitialURLWithTimeout().then(
    (url) =>
      parseExpoGoUrlFromListener(url) ??
      // The path will be nullish in bare apps when the app is launched from the home screen.
      // TODO(EvanBacon): define some policy around notifications.
      getRootURL()
  );
}

let _rootURL: string | undefined;

export function getRootURL(): string {
  if (_rootURL === undefined) {
    _rootURL = Linking.createURL('/');
  }
  return _rootURL;
}

// Expo Go is weird and requires the root path to be `/--/`
function parseExpoGoUrlFromListener<T extends string | null>(url: T): T {
  if (!url || !isExpoGo) {
    return url;
  }
  const { pathname, queryString } = parsePathAndParamsFromExpoGoLink(url);
  // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
  // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
  if (!pathname || pathname === '/') {
    return (getRootURL() + queryString) as T;
  }
  return url;
}

export function addEventListener(listener: (url: string) => void) {
  let callback: (({ url }: { url: string }) => void) | undefined;

  if (isExpoGo) {
    // This extra work is only done in the Expo Go app.
    callback = ({ url }: { url: string }) => {
      listener(parseExpoGoUrlFromListener(url));
    };
  } else {
    callback = ({ url }: { url: string }) => listener(url);
  }
  const subscription = Linking.addEventListener('url', callback);

  return () => {
    // https://github.com/facebook/react-native/commit/6d1aca806cee86ad76de771ed3a1cc62982ebcd7
    subscription?.remove?.();
  };
}

export { getStateFromPath, getPathFromState };
