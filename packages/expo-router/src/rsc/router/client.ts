/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { createElement, useState, Fragment } from 'react';
import type { ComponentProps, FunctionComponent, ReactNode } from 'react';

import { getComponentIds, getInputString } from './common';
import type { RouteProps } from './common';
import { parseRoute, RouterContext } from './router-context';
import { Root, Slot, useRefetch } from '../client';

const getHref = () =>
  process.env.EXPO_OS === 'web' ? window.location.href : globalThis.expoVirtualLocation.href;

function InnerRouter() {
  const refetch = useRefetch();

  const [route] = useState(() => parseRoute(new URL(getHref())));
  const componentIds = getComponentIds(route.path);

  // TODO: strip when "is exporting".
  if (process.env.NODE_ENV === 'development') {
    const refetchRoute = () => {
      const loc = parseRoute(new URL(getHref()));
      const input = getInputString(loc.path);
      refetch(input, loc.searchParams);
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

  const children = componentIds.reduceRight(
    (acc: ReactNode, id) => createElement(Slot, { id, fallback: acc }, acc),
    null
  );

  return createElement(RouterContext.Provider, { value: { route } }, children);
}

export function Router() {
  const route = parseRoute(new URL(getHref()));
  const initialInput = getInputString(route.path);
  const initialSearchParamsString = route.searchParams.toString();
  const unstable_onFetchData = (data: unknown) => {};
  return createElement(
    Root as FunctionComponent<Omit<ComponentProps<typeof Root>, 'children'>>,
    { initialInput, initialSearchParamsString, unstable_onFetchData },
    createElement(InnerRouter)
  );
}

const notAvailableInServer = (name: string) => () => {
  throw new Error(`${name} is not in the server`);
};

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
          changeRoute: notAvailableInServer('changeRoute'),
          prefetchRoute: notAvailableInServer('prefetchRoute'),
        },
      },
      children
    )
  );
}
