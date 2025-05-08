// This MUST be first to ensure that `fetch` is defined in the React Native environment.
import 'react-native/Libraries/Core/InitializeCore';

// Ensure fetch is installed before adding our fetch polyfill to ensure Headers and Request are available globally.
import 'whatwg-fetch';
// This MUST be imported to ensure URL is installed.
import 'expo';
// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/
import Constants from 'expo-constants';

import { install, setLocationHref } from './Location';
import getDevServer from '../getDevServer';

interface ExpoExtraRouterConfig {
  router?: {
    origin?: any;
    generatedOrigin?: any;
  };
}

const manifest = Constants.expoConfig;

function getOrigin() {
  if (process.env.NODE_ENV !== 'production') {
    // e.g. http://localhost:8081
    return getDevServer().url;
  }
  const extra = manifest?.extra as ExpoExtraRouterConfig | null;
  return (
    extra?.router?.origin ??
    // Written automatically during release builds.
    extra?.router?.generatedOrigin
  );
}

// TODO: This would be better if native and tied as close to the JS engine as possible, i.e. it should
// reflect the exact location of the JS file that was executed.
function getBaseUrl() {
  // TODO: Make it official by moving out of `extra`
  const productionBaseUrl = getOrigin();

  if (!productionBaseUrl) {
    return null;
  }

  // Ensure no trailing slash
  return productionBaseUrl?.replace(/\/$/, '');
}

const polyfillSymbol = Symbol.for('expo.polyfillFetchWithWindowLocation');

export function wrapFetchWithWindowLocation(fetch: Function & { [polyfillSymbol]?: boolean }) {
  if (fetch[polyfillSymbol]) {
    return fetch;
  }

  const _fetch = (...props: any[]) => {
    if (props[0] && typeof props[0] === 'string' && props[0].startsWith('/')) {
      props[0] = new URL(props[0], window.location?.origin).toString();
    } else if (props[0] && typeof props[0] === 'object') {
      if (props[0].url && typeof props[0].url === 'string' && props[0].url.startsWith('/')) {
        props[0].url = new URL(props[0].url, window.location?.origin).toString();
      }
    }
    return fetch(...props);
  };

  _fetch[polyfillSymbol] = true;

  return _fetch;
}

const extra = manifest?.extra as ExpoExtraRouterConfig | null;
if (extra?.router?.origin !== false) {
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
    // value: fetch,
    value: wrapFetchWithWindowLocation(fetch),
  });
} else {
  // Polyfill native fetch to support relative URLs
  Object.defineProperty(global, 'fetch', {
    value: fetch,
  });
}
