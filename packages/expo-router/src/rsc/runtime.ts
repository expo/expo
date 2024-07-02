/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getServerReference } from '../server-actions';
// Runtime code for patching Webpack's require function to use Metro.

globalThis.__webpack_chunk_load__ = (id) => {
  console.log(`[${process.env.EXPO_OS}] (flight) loadChunk(${JSON.stringify(id)})`);

  if (id == null) {
    console.warn('Invalid attempting to import nullish chunk');
    return Promise.resolve();
  }

  // This code is only used in SSR. (unclear when though)
  if (typeof window === 'undefined') {
    // 57b61607c2a01ad43bd2ffb42699b0001adb39ac#_$$INLINE_ACTION
    if (typeof id === 'string' && id.match(/[0-9a-z]{40}#/i)) {
      return Promise.resolve();
    }
  }

  if (__DEV__) {
    if (typeof id === 'string') {
      if (process.env.EXPO_OS !== 'web') {
        if (id.includes('/react-native-web/')) {
          throw new Error(`Cannot load React Native Web module on ${process.env.EXPO_OS}: ${id}`);
        }
        if (typeof window === 'undefined' && id.includes('/lib/commonjs/')) {
          console.warn(
            'Attempting to load Node.js submodule in native project. This could be a bug with how the module uses client proxy:',
            id
          );
        }
      }
    }
  }

  // platform=web&dev=true&hot=false&transform.rscPath=%2FRSC&transform.routerRoot=src%2Fapp&resolver.clientboundary=true&modulesOnly=true&runModule=false
  if (__DEV__ && typeof id === 'string') {
    const url = new URL(id, id.startsWith('/') ? 'http://e' : undefined);
    const searchParams = new URLSearchParams();
    searchParams.set('platform', process.env.EXPO_OS);
    searchParams.set('dev', String(__DEV__));
    // searchParams.set('transform.rscPath', process.env.EXPO_RSC_PATH);
    searchParams.set('resolver.clientboundary', String(true));
    searchParams.set('transform.routerRoot', url.searchParams.get('transform.routerRoot') || 'app');
    searchParams.set('modulesOnly', String(true));
    searchParams.set('runModule', String(false));

    if (url.searchParams.has('minify')) {
      searchParams.set('minify', url.searchParams.get('minify')!);
    }
    if (url.searchParams.get('transform.engine')) {
      searchParams.set('transform.engine', url.searchParams.get('transform.engine')!);
    }
    if (url.searchParams.get('transform.baseUrl')) {
      searchParams.set('transform.baseUrl', url.searchParams.get('transform.baseUrl')!);
    }

    // Ensure url.pathname ends with '.bundle'
    if (!url.pathname.endsWith('.bundle')) {
      url.pathname += '.bundle';
    }

    id = url.pathname + '?' + searchParams.toString() + url.hash;
  }

  return global[`${__METRO_GLOBAL_PREFIX__}__loadBundleAsync`](id);
};

globalThis.__webpack_require__ = (id) => {
  console.log(`[${process.env.EXPO_OS}] (flight) require(${JSON.stringify(id)})`);

  // This code is only used in SSR. (unclear when though)
  if (typeof window === 'undefined') {
    // 57b61607c2a01ad43bd2ffb42699b0001adb39ac#_$$INLINE_ACTION
    if (typeof id === 'string' && id.match(/[0-9a-z]{40}#/i)) {
      // TODO: Replace this with a better Server Actions system.
      const m = getServerReference(id);
      // console.log('__webpack_require__ > server action:', id, m);
      return m;
    }
  }

  // @ts-expect-error: Bind the Metro require function to the Webpack name for the adapter. We add this special function to the require polyfill to ensure any errors thrown during importing will be thrown here too. This prevents more confusing errors from occurring when attempting to access properties on an undefined object.
  return __r(id);
};
