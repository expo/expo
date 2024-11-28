// This MUST be first to ensure that `fetch` is defined in the React Native environment.
import 'react-native/Libraries/Core/InitializeCore';

// Ensure fetch is installed before adding our fetch polyfill to ensure Headers and Request are available globally.
import 'whatwg-fetch';
// This MUST be imported to ensure URL is installed.
import 'expo';
// This file configures the runtime environment to increase compatibility with WinterCG.
// https://wintercg.org/
import Constants from 'expo-constants';
import { polyfillGlobal as installGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

import { install, setLocationHref } from './Location';
import getDevServer from '../getDevServer';

const manifest = Constants.expoConfig as Record<string, any> | null;

function getOrigin() {
  if (process.env.NODE_ENV !== 'production') {
    // e.g. http://localhost:8081
    return getDevServer().url;
  }
  return (
    manifest?.extra?.router?.origin ??
    // Written automatically during release builds.
    manifest?.extra?.router?.generatedOrigin
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

// Add a well-known shared symbol that doesn't show up in iteration or inspection
// this can be used to detect if the global object abides by the Expo team's documented
// built-in requirements.
const BUILTIN_SYMBOL = Symbol.for('expo.builtin');

function addBuiltinSymbol(obj: object) {
  Object.defineProperty(obj, BUILTIN_SYMBOL, {
    value: true,
    enumerable: false,
    configurable: false,
  });
  return obj;
}

function installBuiltin(name: string, getValue: () => any) {
  installGlobal(name, () => addBuiltinSymbol(getValue()));
}

try {
  require('web-streams-polyfill');
  // NOTE: Fetch is polyfilled in expo/metro-runtime
  installBuiltin(
    'ReadableStream',
    () => require('web-streams-polyfill/ponyfill/es6').ReadableStream
  );
} catch {}

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
    // value: fetch,
    value: wrapFetchWithWindowLocation(fetch),
  });
} else {
  // Polyfill native fetch to support relative URLs
  Object.defineProperty(global, 'fetch', {
    value: fetch,
  });
}
