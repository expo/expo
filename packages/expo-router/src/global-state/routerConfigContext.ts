'use client';

import { createContext } from 'react';

import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { StoreRedirects } from './types';

export type RouterConfig = {
  routeNode: RouteNode | null;
  linking: ExpoLinkingOptions | undefined;
  redirects: StoreRedirects[];
};

export const RouterConfigContext = createContext<RouterConfig | null>(null);
