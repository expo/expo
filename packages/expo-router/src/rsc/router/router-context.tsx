/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client';

import { createContext } from 'react';

import { PARAM_KEY_SKIP } from './common';
import type { RouteProps } from './common';

export const parseRoute = (url: URL): RouteProps => {
  if ((globalThis as any).__EXPO_ROUTER_404__) {
    return { path: '/404', searchParams: new URLSearchParams() };
  }
  const { pathname, searchParams } = url;
  if (searchParams.has(PARAM_KEY_SKIP)) {
    console.warn(`The search param "${PARAM_KEY_SKIP}" is reserved`);
  }
  return { path: pathname, searchParams };
};

export type ChangeRoute = (
  route: RouteProps,
  options?: {
    checkCache?: boolean;
    skipRefetch?: boolean;
  }
) => void;

export type PrefetchRoute = (route: RouteProps) => void;

export const RouterContext = createContext<{
  route: RouteProps;
  changeRoute: ChangeRoute;
  prefetchRoute: PrefetchRoute;
} | null>(null);
