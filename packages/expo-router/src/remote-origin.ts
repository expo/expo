import Constants from 'expo-constants';
import { useURL } from 'expo-linking';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import getDevServer from 'react-native/Libraries/Core/Devtools/getDevServer';

import { extractExpoPathFromURL } from './fork/extractPathFromURL';

type RemoteServer = {
  getDefault: () => string | null;

  getCurrent: () => string | null;

  prompt: typeof promptChangeServer;
  /** Reset the remote  */
  reset: () => void;
};

declare global {
  /** The client-side controller for the remote server that is used for interacting with SSR. This is useful for testing different servers against production builds. Although, this should never be used in production apps with arbitrary users as it could be leveraged by malicious actors to change the remote server connected to a native client (your app), which has access to sensitive data. */
  var remote: RemoteServer | undefined;
}

const manifest = Constants.expoConfig as Record<string, any> | null;

function getCurrentRemoteOrigin(): string | null {
  return localStorage.getItem('expo_remote_origin') ?? getBaseUrl();
}

// TODO: This would be better if native and tied as close to the JS engine as possible, i.e. it should
// reflect the exact location of the JS file that was executed.
function getBaseUrl(): string | null {
  if (getDevServer().bundleLoadedFromServer) {
    // if (process.env.NODE_ENV !== 'production') {
    // e.g. http://localhost:19006
    return getDevServer().url?.replace(/\/$/, '');
  }

  // TODO: Make it official by moving out of `extra`
  const productionBaseUrl = manifest?.extra?.router?.origin;

  if (!productionBaseUrl) {
    return null;
  }

  // Ensure no trailing slash
  return productionBaseUrl?.replace(/\/$/, '');
}

const remote: RemoteServer = {
  getDefault: getBaseUrl,
  getCurrent: getCurrentRemoteOrigin,
  prompt: promptChangeServer,
  reset() {
    localStorage.removeItem('expo_remote_origin');
    // NOTE: No standard way to restart the app. This will just throw an error that breaks the app lol.
    globalThis.location.reload();
  },
};

export function promptChangeServer(
  currentUrl: string | null = getCurrentRemoteOrigin(),
  placeholder?: string
) {
  Alert.prompt(
    'Change Remote Origin',
    `Enter a new remote origin (current: ${currentUrl}):`,
    [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: (newOrigin) => {
          if (!newOrigin) {
            remote.reset();
            return;
          }
          newOrigin = newOrigin.trim();

          if (newOrigin !== currentUrl) {
            localStorage.setItem('expo_remote_origin', coerceUrl(newOrigin));
            // NOTE: No standard way to restart the app. This will just throw an error that breaks the app lol.
            globalThis.location.reload();
          }
        },
      },
    ],
    'plain-text',
    placeholder,
    'default'
  );
}

globalThis.remote = remote;

// scheme://?__remote_origin=https://bacon.expo.app/
export function useRemoteOriginDevTool() {
  // Enables changing the origin URL for the server. Useful for debugging release apps.
  // Deep link in with scheme://?__remote_origin=http://localhost:3000 to change the on-device origin. This will persist the value and reset the JS context.
  // Use `?__remote_origin=` to reset the origin.

  const url = useURL();

  useEffect(() => {
    if (!url || !url.match(/__remote_origin/)) {
      return;
    }

    const normal = extractExpoPathFromURL(url);

    const parsed = new URL(normal, 'http://e');
    const remoteOrigin = parsed.searchParams.get('__remote_origin');

    console.log('[DEV TOOL]: Remote origin link found:', parsed.toString());

    if (remoteOrigin != null) {
      if (remoteOrigin) {
        const possibleUrl = coerceUrl(decodeURIComponent(remoteOrigin));
        const currentOrigin = getCurrentRemoteOrigin();

        if (currentOrigin === possibleUrl) {
          alert('The remote origin is already set to the provided value: ' + remoteOrigin);
          return;
        }

        promptChangeServer(currentOrigin, remoteOrigin);
      } else {
        Alert.prompt(
          'Change Remote Origin',
          `Reset the remote origin to the default? (current: ${getCurrentRemoteOrigin()}, default: ${getBaseUrl()})`,
          [
            {
              text: 'Cancel',
              onPress: () => {},
              style: 'cancel',
            },
            {
              text: 'OK',
              onPress: () => {
                localStorage.removeItem('expo_remote_origin');
                globalThis.location.reload();
              },
            },
          ]
        );
      }
    }
  }, [url]);
}

function coerceUrl(urlString: string) {
  try {
    let nextUrl = new URL(urlString);
    // Ensure `http://` or `https://` is present
    if (!nextUrl.protocol) {
      nextUrl = new URL('http://' + urlString);
    }
    return nextUrl.toString();
  } catch {
    console.log('Failed coercing URL:', urlString);
    return urlString;
  }
}
