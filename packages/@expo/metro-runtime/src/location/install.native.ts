// This MUST be first to ensure that `fetch` is defined in the React Native environment.
import 'react-native/Libraries/Core/InitializeCore';

import Constants from 'expo-constants';

import { install, setLocationHref } from './Location';
import getDevServer from '../getDevServer';

let hasWarned = false;

const manifest = Constants.expoConfig as Record<string, any> | null;

// Add a development warning for fetch requests with relative paths
// to ensure developers are aware of the need to configure a production
// base URL in the Expo config (app.json) under `expo.extra.router.origin`.
function warnProductionOriginNotConfigured(requestUrl: string) {
  if (hasWarned) {
    return;
  }
  hasWarned = true;
  if (!manifest?.extra?.router?.origin) {
    console.warn(
      `The relative fetch request "${requestUrl}" will not work in production until the Expo Router Config Plugin (app.json) is configured with the \`origin\` prop set to the base URL of your web server, e.g. \`{ plugins: [["expo-router", { origin: "..." }]] }\`. [Learn more](https://expo.github.io/router/docs/lab/runtime-location)`
    );
  }
}

// TODO: This would be better if native and tied as close to the JS engine as possible, i.e. it should
// reflect the exact location of the JS file that was executed.
function getBaseUrl() {
  if (process.env.NODE_ENV !== 'production') {
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

function wrapFetchWithWindowLocation(fetch: Function & { __EXPO_BASE_URL_POLYFILLED?: boolean }) {
  if (fetch.__EXPO_BASE_URL_POLYFILLED) {
    return fetch;
  }

  const _fetch = (...props: any[]) => {
    if (props[0] && typeof props[0] === 'string' && props[0].startsWith('/')) {
      if (process.env.NODE_ENV !== 'production') {
        warnProductionOriginNotConfigured(props[0]);
      }

      props[0] = new URL(props[0], window.location?.origin).toString();
    } else if (props[0] && typeof props[0] === 'object') {
      if (props[0].url && typeof props[0].url === 'string' && props[0].url.startsWith('/')) {
        if (process.env.NODE_ENV !== 'production') {
          warnProductionOriginNotConfigured(props[0]);
        }

        props[0].url = new URL(props[0].url, window.location?.origin).toString();
      }
    }
    return fetch(...props);
  };

  _fetch.__EXPO_BASE_URL_POLYFILLED = true;

  return _fetch;
}

if (manifest?.extra?.router?.origin !== false) {
  // Polyfill window.location in native runtimes.
  if (typeof window !== 'undefined' && !window.location) {
    const url = getBaseUrl();
    if (url) {
      setLocationHref(url);
      install();
    }
  }
  // Polyfill native fetch to support relative URLs
  Object.defineProperty(global, 'fetch', {
    value: wrapFetchWithWindowLocation(fetch),
  });
}
