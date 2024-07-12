/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { type AsyncLocalStorage } from 'node:async_hooks';
import type { ReactNode } from 'react';

import type { PathSpec } from './path';

declare let globalThis: {
  __EXPO_RSC_CACHE__?: Map<string, any>;
};

type Config = any;

type Elements = Record<string, ReactNode>;

export type BuildConfig = {
  pathname: string | PathSpec; // TODO drop support for string?
  isStatic?: boolean | undefined;
  entries?: {
    input: string;
    skipPrefetch?: boolean | undefined;
    isStatic?: boolean | undefined;
  }[];
  context?: Record<string, unknown>;
  customCode?: string; // optional code to inject TODO hope to remove this
  customData?: unknown; // should be serializable with JSON.stringify
}[];

export type RenderEntries = (
  input: string,
  options: {
    searchParams: URLSearchParams;
    buildConfig: BuildConfig | undefined;
  }
) => Promise<Elements | null>;

export type GetBuildConfig = (
  unstable_collectClientModules: (input: string) => Promise<string[]>
) => Promise<BuildConfig>;

export type GetSsrConfig = (
  pathname: string,
  options: {
    searchParams: URLSearchParams;
    buildConfig?: BuildConfig | undefined;
  }
) => Promise<{
  input: string;
  searchParams?: URLSearchParams;
  body: ReactNode;
} | null>;

export function defineEntries(
  renderEntries: RenderEntries,
  getBuildConfig?: GetBuildConfig,
  getSsrConfig?: GetSsrConfig
) {
  return { renderEntries, getBuildConfig, getSsrConfig };
}

export type EntriesDev = {
  default: ReturnType<typeof defineEntries>;
};

export type EntriesPrd = EntriesDev & {
  loadConfig: () => Promise<Config>;
  loadModule: (id: string) => Promise<unknown>;
  dynamicHtmlPaths: [pathSpec: PathSpec, htmlHead: string][];
  publicIndexHtml: string;
};

type RenderStore<RscContext extends Record<string, unknown> = Record<string, unknown>> = {
  rerender: (input: string, searchParams?: URLSearchParams) => void;
  context: RscContext;
};

// TODO(EvanBacon): This can leak between platforms and runs.
// We need to share this module between the server action module and the renderer module, per platform, and invalidate on refreshes.
function getGlobalCacheForPlatform(): Pick<AsyncLocalStorage<RenderStore>, 'getStore' | 'run'> {
  if (!globalThis.__EXPO_RSC_CACHE__) {
    globalThis.__EXPO_RSC_CACHE__ = new Map();
  }

  if (globalThis.__EXPO_RSC_CACHE__.has(process.env.EXPO_OS!)) {
    return globalThis.__EXPO_RSC_CACHE__.get(process.env.EXPO_OS!)!;
  }
  try {
    const { AsyncLocalStorage } = require('node:async_hooks');
    // @ts-expect-error: This is a Node.js feature.
    const serverCache = new AsyncLocalStorage<RenderStore>();
    globalThis.__EXPO_RSC_CACHE__.set(process.env.EXPO_OS!, serverCache);
    return serverCache;
  } catch (error) {
    console.log('[RSC]: Failed to create cache:', error);

    // Fallback to a simple in-memory cache.
    const cache = new Map();
    const serverCache = {
      getStore: () => cache.get('store'),
      run: <T>(store: RenderStore, fn: () => T) => {
        cache.set('store', store);
        try {
          return fn();
        } finally {
          cache.delete('store');
        }
      },
    };
    globalThis.__EXPO_RSC_CACHE__.set(process.env.EXPO_OS!, serverCache);
    return serverCache;
  }
}

let previousRenderStore: RenderStore | undefined;
let currentRenderStore: RenderStore | undefined;

const renderStorage = getGlobalCacheForPlatform();

/**
 * This is an internal function and not for public use.
 */
export const runWithRenderStore = <T>(renderStore: RenderStore, fn: () => T): T => {
  if (renderStorage) {
    return renderStorage.run(renderStore, fn);
  }
  previousRenderStore = currentRenderStore;
  currentRenderStore = renderStore;
  try {
    return fn();
  } finally {
    currentRenderStore = previousRenderStore;
  }
};

export function rerender(input: string, searchParams?: URLSearchParams) {
  const renderStore = renderStorage?.getStore() ?? currentRenderStore;
  if (!renderStore) {
    throw new Error('Render store is not available');
  }
  renderStore.rerender(input, searchParams);
}

export function getContext<
  RscContext extends Record<string, unknown> = Record<string, unknown>,
>(): RscContext {
  const renderStore = renderStorage?.getStore() ?? currentRenderStore;
  if (!renderStore) {
    throw new Error('Render store is not available');
  }
  return renderStore.context as RscContext;
}
