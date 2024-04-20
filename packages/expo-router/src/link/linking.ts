import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { adjustPathname } from '../fork/extractPathFromURL';
import getPathFromState from '../fork/getPathFromState';
import getStateFromPath from '../fork/getStateFromPath';

const isExpoGo = typeof expo !== 'undefined' && globalThis.expo?.modules?.ExpoGo;

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
  return Promise.race<string>([
    (async () => {
      const url = await Linking.getInitialURL();

      // NOTE(EvanBacon): This could probably be wrapped with the development boundary
      // since Expo Go is mostly just used in development.

      // Expo Go is weird and requires the root path to be `/--/`
      if (url && isExpoGo) {
        const parsed = Linking.parse(url);
        // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
        // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
        if (
          parsed.path === null ||
          ['', '/'].includes(
            adjustPathname({
              hostname: parsed.hostname,
              pathname: parsed.path,
            })
          )
        ) {
          return getRootURL();
        }
      }
      // The path will be nullish in bare apps when the app is launched from the home screen.
      // TODO(EvanBacon): define some policy around notifications.
      return url ?? getRootURL();
    })(),
    new Promise<string>((resolve) =>
      // Timeout in 150ms if `getInitialState` doesn't resolve
      // Workaround for https://github.com/facebook/react-native/issues/25675
      setTimeout(() => resolve(getRootURL()), 150)
    ),
  ]);
}

let _rootURL: string | undefined;

export function getRootURL(): string {
  if (_rootURL === undefined) {
    _rootURL = Linking.createURL('/');
  }
  return _rootURL;
}

export function addEventListener(listener: (url: string) => void) {
  let callback: (({ url }: { url: string }) => void) | undefined;

  if (isExpoGo) {
    // This extra work is only done in the Expo Go app.
    callback = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);

      // If the URL is defined (default in Expo Go dev apps) and the URL has no path:
      // `exp://192.168.87.39:19000/` then use the default `exp://192.168.87.39:19000/--/`
      if (
        parsed.path === null ||
        ['', '/'].includes(adjustPathname({ hostname: parsed.hostname, pathname: parsed.path }))
      ) {
        listener(getRootURL());
      } else {
        listener(url);
      }
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
