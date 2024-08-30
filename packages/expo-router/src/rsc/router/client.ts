/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/dai-shi/waku/blob/3d1cc7d714b67b142c847e879c30f0724fc457a7/packages/waku/src/router/client.ts#L1
 */

'use client';

import { createElement, createContext, useState, Fragment } from 'react';
import type { ComponentProps, FunctionComponent, ReactNode } from 'react';

import { getComponentIds, getInputString } from './common.js';
import type { RouteProps } from './common.js';
import { Root, Slot, useRefetch } from './host.js';

const normalizeRoutePath = (path: string) => {
  for (const suffix of ['/', '/index.html']) {
    if (path.endsWith(suffix)) {
      return path.slice(0, -suffix.length) || '/';
    }
  }
  return path;
};

const parseRoute = (url: URL): RouteProps => {
  const { pathname, searchParams, hash } = url;
  return {
    path: normalizeRoutePath(pathname),
    query: searchParams.toString(),
    hash,
  };
};

const getHref = () =>
  process.env.EXPO_OS === 'web'
    ? window.location.href
    : // TODO: This is hardcoded on native to simplify the initial PR.
      'http://localhost:8081/';

const RouterContext = createContext<{
  route: RouteProps;
} | null>(null);

function InnerRouter() {
  const refetch = useRefetch();
  const [route] = useState(() => parseRoute(new URL(getHref())));
  const componentIds = getComponentIds(route.path);

  // TODO: strip when "is exporting".
  if (process.env.NODE_ENV === 'development') {
    const refetchRoute = () => {
      const loc = parseRoute(new URL(getHref()));
      const input = getInputString(loc.path);
      refetch(input, loc.query);
    };
    globalThis.__EXPO_RSC_RELOAD_LISTENERS__ ||= [];
    const index = globalThis.__EXPO_RSC_RELOAD_LISTENERS__.indexOf(
      globalThis.__EXPO_REFETCH_ROUTE__
    );
    if (index !== -1) {
      globalThis.__EXPO_RSC_RELOAD_LISTENERS__.splice(index, 1, refetchRoute);
    } else {
      globalThis.__EXPO_RSC_RELOAD_LISTENERS__.unshift(refetchRoute);
    }
    globalThis.__EXPO_REFETCH_ROUTE__ = refetchRoute;
  }

  return createElement(
    RouterContext.Provider,
    { value: { route } },
    componentIds.reduceRight<null | ReactNode>(
      (acc: ReactNode, id) => createElement(Slot, { id, fallback: acc }, acc),
      null
    )
  );
}

export function Router() {
  const route = parseRoute(new URL(getHref()));
  const initialInput = getInputString(route.path);
  const initialParams = JSON.stringify({ query: route.query });
  const unstable_onFetchData = () => {
    // TODO: add data fetching
  };
  return createElement(
    Root as FunctionComponent<Omit<ComponentProps<typeof Root>, 'children'>>,
    { initialInput, initialParams, unstable_onFetchData },
    createElement(InnerRouter)
  );
}

/**
 * ServerRouter for SSR
 * This is not a public API.
 */
export function ServerRouter({ children, route }: { children: ReactNode; route: RouteProps }) {
  return createElement(
    Fragment,
    null,
    createElement(
      RouterContext.Provider,
      {
        value: {
          route,
        },
      },
      children
    )
  );
}
