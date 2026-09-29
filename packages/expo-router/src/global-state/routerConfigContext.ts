'use client';

import { createContext } from 'react';

import type { RouteNode } from '../Route';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import type { ImportMode } from '../import-mode';
import type { StoreRedirects } from './types';

export type RouterConfig = {
  routeNode: RouteNode | null;
  linking: ExpoLinkingOptions | undefined;
  redirects: StoreRedirects[];
  /** How route modules load. Defaults to the bundler's setting for async routes. */
  importMode?: ImportMode;
};

export const RouterConfigContext = createContext<RouterConfig | null>(null);
