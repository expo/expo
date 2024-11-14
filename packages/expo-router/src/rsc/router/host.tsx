/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/32d52242c1450b5f5965860e671ff73c42da8bd0/packages/waku/src/client.ts#L1
 */

//// <reference types="react/canary" />
'use client';

import {
  createContext,
  createElement,
  memo,
  useCallback,
  useState,
  startTransition,
  // @ts-expect-error
  use,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import RSDWClient from 'react-server-dom-webpack/client';

import { MetroServerError, ReactServerError } from './errors';
import { fetch } from './fetch';
import { encodeInput, encodeActionId } from './utils';
import { getDevServer } from '../../getDevServer';
import { getOriginFromConstants } from '../../head/url';

const { createFromFetch, encodeReply } = RSDWClient;

// TODO: Maybe this could be a bundler global instead.
const IS_DOM =
  // @ts-expect-error: Added via react-native-webview
  typeof ReactNativeWebView !== 'undefined';

// NOTE: Ensured to start with `/`.
const RSC_PATH = '/_flight/' + process.env.EXPO_OS; // process.env.EXPO_RSC_PATH;

// Using base URL for remote hosts isn't currently supported in DOM components as we use it for offline assets.
const BASE_URL = IS_DOM ? '' : process.env.EXPO_BASE_URL;

let BASE_PATH = `${BASE_URL}${RSC_PATH}`;

if (!BASE_PATH.startsWith('/')) {
  BASE_PATH = '/' + BASE_PATH;
}

if (!BASE_PATH.endsWith('/')) {
  BASE_PATH += '/';
}

if (BASE_PATH === '/') {
  throw new Error(
    `Invalid React Flight path "${BASE_PATH}". The path should not live at the project root, e.g. /_flight/. Dev server URL: ${
      getDevServer().fullBundleUrl
    }`
  );
}

type OnFetchData = (data: unknown) => void;
type SetElements = (updater: Elements | ((prev: Elements) => Elements)) => void;

const RSC_CONTENT_TYPE = 'text/x-component';

const ENTRY = 'e';
const SET_ELEMENTS = 's';
const ON_FETCH_DATA = 'o';

type FetchCache = {
  [ENTRY]?: [input: string, params: unknown, elements: Elements];
  [SET_ELEMENTS]?: SetElements;
  [ON_FETCH_DATA]?: OnFetchData | undefined;
};

const defaultFetchCache: FetchCache = {};

const NO_CACHE_HEADERS: Record<string, string> =
  process.env.EXPO_OS === 'web'
    ? {}
    : // These are needed for iOS + Prod to get updates after the first request.
      {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      };

const ACTION_HEADERS = {
  ...NO_CACHE_HEADERS,
  accept: RSC_CONTENT_TYPE,
  'expo-platform': process.env.EXPO_OS!,
};

const checkStatus = async (responsePromise: Promise<Response>): Promise<Response> => {
  // TODO: Combine with metro async fetch logic.
  const response = await responsePromise;
  if (!response.ok) {
    // NOTE(EvanBacon): Transform the Metro development error into a JS error that can be used by LogBox.
    // This was tested against using a Class component in a server component.
    if (response.status === 500) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        throw new ReactServerError(errorText, response.url, response.status);
      }
      // TODO: This should be a dev-only error. Add handling for production equivalent.
      throw new MetroServerError(errorJson, response.url);
    }

    let responseText;
    try {
      responseText = await response.text();
    } catch {
      throw new ReactServerError(response.statusText, response.url, response.status);
    }
    throw new ReactServerError(responseText, response.url, response.status);
  }
  return response;
};

type Elements = Promise<Record<string, ReactNode>> & {
  prev?: Record<string, ReactNode> | undefined;
};
function getCached<T>(c: () => T, m: WeakMap<object, T>, k: object): T {
  return (m.has(k) ? m : m.set(k, c())).get(k) as T;
}

const cache1 = new WeakMap();
const mergeElements = (a: Elements, b: Elements): Elements => {
  const getResult = () => {
    const promise: Elements = new Promise((resolve, reject) => {
      Promise.all([a, b])
        .then(([a, b]) => {
          const nextElements = { ...a, ...b };
          delete nextElements._value;
          promise.prev = a;
          resolve(nextElements);
        })
        .catch((e) => {
          a.then(
            (a) => {
              promise.prev = a;
              reject(e);
            },
            () => {
              promise.prev = a.prev;
              reject(e);
            }
          );
        });
    });
    return promise;
  };
  const cache2 = getCached(() => new WeakMap(), cache1, a);
  return getCached(getResult, cache2, b);
};

/**
 * callServer callback
 * This is not a public API.
 */
export const callServerRSC = async (
  actionId: string,
  args?: unknown[],
  fetchCache = defaultFetchCache
) => {
  const url = getAdjustedRemoteFilePath(BASE_PATH + encodeInput(encodeActionId(actionId)));
  const response =
    args === undefined
      ? fetch(url, { headers: ACTION_HEADERS })
      : encodeReply(args).then((body) =>
          fetch(url, { method: 'POST', body, headers: ACTION_HEADERS })
        );
  const data = createFromFetch<Awaited<Elements>>(checkStatus(response), {
    callServer: (actionId: string, args: unknown[]) => callServerRSC(actionId, args, fetchCache),
  });
  fetchCache[ON_FETCH_DATA]?.(data);
  startTransition(() => {
    // FIXME this causes rerenders even if data is empty
    fetchCache[SET_ELEMENTS]?.((prev) => mergeElements(prev, data));
  });
  return (await data)._value;
};

const prefetchedParams = new WeakMap<Promise<unknown>, unknown>();

const fetchRSCInternal = (url: string, params: unknown) =>
  params === undefined
    ? fetch(url, {
        // Disable caching
        headers: {
          ...NO_CACHE_HEADERS,
          'expo-platform': process.env.EXPO_OS!,
        },
      })
    : typeof params === 'string'
      ? fetch(url, {
          headers: {
            ...NO_CACHE_HEADERS,
            'expo-platform': process.env.EXPO_OS!,
            'X-Expo-Params': params,
          },
        })
      : encodeReply(params).then((body) =>
          fetch(url, { method: 'POST', headers: ACTION_HEADERS, body })
        );

export const fetchRSC = (
  input: string,
  params?: unknown,
  fetchCache = defaultFetchCache
): Elements => {
  // TODO: strip when "is exporting".
  if (process.env.NODE_ENV === 'development') {
    const refetchRsc = () => {
      delete fetchCache[ENTRY];
      const data = fetchRSC(input, params, fetchCache);
      fetchCache[SET_ELEMENTS]?.(() => data);
    };
    globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
    const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(globalThis.__EXPO_REFETCH_RSC__);
    if (index !== -1) {
      globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRsc);
    } else {
      globalThis.__EXPO_RSC_RELOAD_LISTENERS__.push(refetchRsc);
    }
    globalThis.__EXPO_REFETCH_RSC__ = refetchRsc;
  }

  const entry = fetchCache[ENTRY];
  if (entry && entry[0] === input && entry[1] === params) {
    return entry[2];
  }

  // eslint-disable-next-line no-multi-assign
  const prefetched = ((globalThis as any).__EXPO_PREFETCHED__ ||= {});
  // TODO: Load from on-disk on native when indicated.
  // const reqPath = fetchOptions?.remote ? getAdjustedRemoteFilePath(url) : getAdjustedRemoteFilePath(url);
  const url = getAdjustedRemoteFilePath(BASE_PATH + encodeInput(input));
  const hasValidPrefetchedResponse =
    !!prefetched[url] &&
    // HACK .has() is for the initial hydration
    // It's limited and may result in a wrong result. FIXME
    (!prefetchedParams.has(prefetched[url]) || prefetchedParams.get(prefetched[url]) === params);
  const response = hasValidPrefetchedResponse ? prefetched[url] : fetchRSCInternal(url, params);
  delete prefetched[url];
  const data = createFromFetch<Awaited<Elements>>(checkStatus(response), {
    callServer: (actionId: string, args: unknown[]) => callServerRSC(actionId, args, fetchCache),
  });
  fetchCache[ON_FETCH_DATA]?.(data);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  fetchCache[ENTRY] = [input, params, data];
  return data;
};

function getAdjustedRemoteFilePath(path: string): string {
  if (IS_DOM && process.env.NODE_ENV === 'production') {
    const origin = getOriginFromConstants();
    if (!origin) {
      throw new Error(
        'Expo RSC: Origin not found in Constants. This is required for production DOM components using server actions.'
      );
    }
    // DOM components in production need to use the same origin logic as native.
    return new URL(path, origin).toString();
  }

  if (!IS_DOM && process.env.EXPO_OS === 'web') {
    return path;
  }

  return new URL(path, window.location.href).toString();
}

export const prefetchRSC = (input: string, params?: unknown): void => {
  // eslint-disable-next-line no-multi-assign
  const prefetched = ((globalThis as any).__EXPO_PREFETCHED__ ||= {});
  const url = getAdjustedRemoteFilePath(BASE_PATH + encodeInput(input));
  if (!(url in prefetched)) {
    prefetched[url] = fetchRSCInternal(url, params);
    prefetchedParams.set(prefetched[url], params);
  }
};

const RefetchContext = createContext<(input: string, searchParams?: URLSearchParams) => void>(
  () => {
    throw new Error('Missing Root component');
  }
);
const ElementsContext = createContext<Elements | null>(null);

export const Root = ({
  initialInput,
  initialParams,
  fetchCache = defaultFetchCache,

  unstable_onFetchData,
  children,
}: {
  initialInput?: string;
  initialParams?: unknown;
  fetchCache?: FetchCache;
  unstable_onFetchData?: (data: unknown) => void;
  children: ReactNode;
}) => {
  fetchCache[ON_FETCH_DATA] = unstable_onFetchData;
  const [elements, setElements] = useState(() =>
    fetchRSC(initialInput || '', initialParams, fetchCache)
  );
  useEffect(() => {
    fetchCache[SET_ELEMENTS] = setElements;
  }, [fetchCache, setElements]);
  const refetch = useCallback(
    (input: string, params?: unknown) => {
      // clear cache entry before fetching
      delete fetchCache[ENTRY];
      const data = fetchRSC(input, params, fetchCache);
      startTransition(() => {
        setElements((prev) => mergeElements(prev, data));
      });
    },
    [fetchCache]
  );
  return createElement(
    RefetchContext.Provider,
    { value: refetch },
    createElement(ElementsContext.Provider, { value: elements }, children)
  );
};

export const useRefetch = () => use(RefetchContext);

const ChildrenContext = createContext<ReactNode>(undefined);
const ChildrenContextProvider = memo(ChildrenContext.Provider);

export const Slot = ({
  id,
  children,
  fallback,
}: {
  id: string;
  children?: ReactNode;
  fallback?: ReactNode;
}) => {
  const elementsPromise = use(ElementsContext);
  if (!elementsPromise) {
    throw new Error('Missing Root component');
  }
  const elements = use(elementsPromise);
  if (!(id in elements)) {
    if (fallback) {
      return fallback;
    }
    throw new Error('Not found: ' + id + '. Expected: ' + Object.keys(elements).join(', '));
  }
  return createElement(ChildrenContextProvider, { value: children }, elements[id]);
};

export const Children = () => use(ChildrenContext);

/**
 * ServerRoot for SSR
 * This is not a public API.
 */
export const ServerRoot = ({ elements, children }: { elements: Elements; children: ReactNode }) =>
  createElement(ElementsContext.Provider, { value: elements }, children);
