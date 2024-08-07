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

import * as FS from 'expo-file-system';
import {
  createContext,
  createElement,
  memo,
  useCallback,
  useState,
  startTransition,
  // @ts-expect-error
  use,
} from 'react';
import type { ReactNode } from 'react';
import RSDWClient from 'react-server-dom-webpack/client';

import { MetroServerError, ReactServerError } from './errors';
import { fetch } from './fetch';
import { getDevServer } from '../../getDevServer';

const { createFromFetch, encodeReply } = RSDWClient;

// NOTE: Ensured to start with `/`.
const RSC_PATH = '/_flight/' + process.env.EXPO_OS; // process.env.EXPO_RSC_PATH;

let BASE_PATH = `${process.env.EXPO_BASE_URL}${RSC_PATH}`;

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
  console.log('[Router] Fetched', response.url, response.status);

  return response;
};

type Elements = Promise<Record<string, ReactNode>>;

function getCached<T>(c: () => T, m: WeakMap<object, T>, k: object): T {
  return (m.has(k) ? m : m.set(k, c())).get(k) as T;
}

const cache1 = new WeakMap();
const mergeElements = (a: Elements, b: Elements | Awaited<Elements>): Elements => {
  const getResult = async () => {
    const nextElements = { ...(await a), ...(await b) };
    delete nextElements._value;
    return nextElements;
  };
  const cache2 = getCached(() => new WeakMap(), cache1, a);
  return getCached(getResult, cache2, b);
};

type SetElements = (updater: Elements | ((prev: Elements) => Elements)) => void;
type CacheEntry = [
  input: string,
  searchParamsString: string,
  setElements: SetElements,
  elements: Elements,
];

const fetchCache: [CacheEntry?] = [];

const RSC_CONTENT_TYPE = 'text/x-component';

export const fetchRSC = (
  input: string,
  searchParamsString: string,
  setElements: SetElements,
  cache = fetchCache,
  unstable_onFetchData?: (data: unknown) => void,
  fetchOptions?: { remote: boolean }
): Elements => {
  // TODO: strip when "is exporting".
  if (process.env.NODE_ENV === 'development') {
    const refetchRsc = () => {
      cache.splice(0);
      const data = fetchRSC(input, searchParamsString, setElements, cache, unstable_onFetchData, {
        remote: true,
      });
      setElements(data);
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

  let entry: CacheEntry | undefined = cache[0];
  if (entry && entry[0] === input && entry[1] === searchParamsString) {
    entry[2] = setElements;
    return entry[3];
  }
  const options = {
    async callServer(actionId: string, args: unknown[]) {
      console.log('[Router] Server Action invoked:', actionId);
      const reqPath = getAdjustedRemoteFilePath(
        BASE_PATH + encodeInput(encodeURIComponent(actionId))
      );

      let requestOpts: Pick<RequestInit, 'headers' | 'body'>;
      if (!Array.isArray(args) || args.some((a) => a instanceof FormData)) {
        requestOpts = {
          headers: { accept: RSC_CONTENT_TYPE },
          body: await encodeReply(args),
        };
      } else {
        requestOpts = {
          headers: {
            accept: RSC_CONTENT_TYPE,
            'content-type': 'application/json',
          },
          body: JSON.stringify(args),
        };
      }

      const response = fetch(reqPath, {
        method: 'POST',
        // @ts-expect-error: non-standard feature for streaming.
        duplex: 'half',
        ...requestOpts,
        headers: {
          ...requestOpts.headers,
          'expo-platform': process.env.EXPO_OS!,
        },
      });
      const data = createFromFetch<Awaited<Elements>>(checkStatus(response), options);
      const setElements = entry![2];
      startTransition(() => {
        // FIXME this causes rerenders even if data is empty
        setElements((prev) => mergeElements(prev, data));
      });

      const fullRes = await data;
      console.log('[Router] Server Action resolved:', fullRes._value);

      return fullRes._value;
    },
  };
  // eslint-disable-next-line no-multi-assign
  const prefetched = ((globalThis as any).__EXPO_PREFETCHED__ ||= {});
  const url = BASE_PATH + encodeInput(input) + (searchParamsString ? '?' + searchParamsString : '');
  const reqPath = fetchOptions?.remote ? getAdjustedRemoteFilePath(url) : getAdjustedFilePath(url);
  console.log('fetch', reqPath);
  const response =
    prefetched[url] ||
    fetch(reqPath, {
      headers: {
        'expo-platform': process.env.EXPO_OS!,
      },
    });
  delete prefetched[url];
  const data = createFromFetch<Awaited<Elements>>(checkStatus(response), options);
  unstable_onFetchData?.(data);

  // eslint-disable-next-line no-multi-assign
  cache[0] = entry = [input, searchParamsString, setElements, data];
  return data;
};

function getAdjustedRemoteFilePath(path: string): string {
  if (process.env.EXPO_OS === 'web') {
    return path;
  }

  return new URL(path, window.location.href).toString();
}

function getAdjustedFilePath(path: string): string {
  if (process.env.EXPO_OS === 'web') {
    return path;
  }

  // Server actions should be fetched from the server every time.
  if (path.match(/[0-9a-z]{40}#/i)) {
    return getAdjustedRemoteFilePath(path);
  }

  if (getDevServer().bundleLoadedFromServer) {
    return getAdjustedRemoteFilePath(path);
  }

  if (process.env.EXPO_OS === 'android') {
    return 'file:///android_asset' + path;
  }

  return 'file://' + FS.bundleDirectory + path;
}

export const prefetchRSC = (input: string, searchParamsString: string): void => {
  // eslint-disable-next-line no-multi-assign
  const prefetched = ((globalThis as any).__EXPO_PREFETCHED__ ||= {});
  const url = getAdjustedFilePath(
    BASE_PATH + encodeInput(input) + (searchParamsString ? '?' + searchParamsString : '')
  );
  if (!(url in prefetched)) {
    prefetched[url] = fetch(url, {
      headers: {
        'expo-platform': process.env.EXPO_OS!,
      },
    });
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
  initialSearchParamsString,
  cache,
  unstable_onFetchData,
  children,
}: {
  initialInput?: string;
  initialSearchParamsString?: string;
  cache?: typeof fetchCache;
  unstable_onFetchData?: (data: unknown) => void;
  children: ReactNode;
}) => {
  const [elements, setElements] = useState(() =>
    fetchRSC(
      initialInput || '',
      initialSearchParamsString || '',
      (fn) => setElements(fn),
      cache,
      unstable_onFetchData
    )
  );
  const refetch = useCallback(
    (input: string, searchParams?: URLSearchParams) => {
      (cache || fetchCache).splice(0); // clear cache before fetching
      const data = fetchRSC(
        input,
        searchParams?.toString() || '',
        setElements,
        cache,
        unstable_onFetchData,
        { remote: true }
      );
      setElements((prev) => mergeElements(prev, data));
    },
    [cache, unstable_onFetchData]
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

const encodeInput = (input: string) => {
  if (input === '') {
    return 'index.txt';
  }
  if (input === 'index') {
    throw new Error('Input should not be `index`');
  }
  if (input.startsWith('/')) {
    throw new Error('Input should not start with `/`');
  }
  if (input.endsWith('/')) {
    throw new Error('Input should not end with `/`');
  }
  return input + '.txt';
};
