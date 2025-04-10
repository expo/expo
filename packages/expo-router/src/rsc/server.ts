/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AsyncLocalStorage } from 'async_hooks';
import type { ReactNode } from 'react';

import type { PathSpec } from './path';

export const REQUEST_HEADERS = '__expo_requestHeaders';

declare let globalThis: {
  __EXPO_RSC_CACHE__?: Map<string, any>;
  __expo_platform_header?: string;
  __webpack_chunk_load__: (id: string) => Promise<any>;
  __webpack_require__: (id: string) => any;
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
    params: unknown | undefined;
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
  html: ReactNode;
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

type RenderStore<> = {
  rerender: (input: string, params?: unknown) => void;
  context: Record<string, unknown>;
};

// TODO(EvanBacon): This can leak between platforms and runs.
// We need to share this module between the server action module and the renderer module, per platform, and invalidate on refreshes.
function getGlobalCacheForPlatform() {
  // HACK: This is a workaround for the shared middleware being shared between web and native.
  // In production the shared middleware is web-only and that causes the first version of this module
  // to be bound to web.
  const platform = globalThis.__expo_platform_header ?? process.env.EXPO_OS;
  if (!globalThis.__EXPO_RSC_CACHE__) {
    globalThis.__EXPO_RSC_CACHE__ = new Map();
  }

  if (globalThis.__EXPO_RSC_CACHE__.has(platform!)) {
    return globalThis.__EXPO_RSC_CACHE__.get(platform!)!;
  }

  const serverCache = new AsyncLocalStorage<RenderStore>();

  globalThis.__EXPO_RSC_CACHE__.set(platform!, serverCache);

  return serverCache;
}

let previousRenderStore: RenderStore | undefined;
let currentRenderStore: RenderStore | undefined;

/**
 * This is an internal function and not for public use.
 */
export const runWithRenderStore = <T>(renderStore: RenderStore, fn: () => T): T => {
  const renderStorage = getGlobalCacheForPlatform();
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

export async function rerender(input: string, params?: unknown) {
  const renderStorage = getGlobalCacheForPlatform();
  const renderStore = renderStorage.getStore() ?? currentRenderStore;
  if (!renderStore) {
    throw new Error('Render store is not available for rerender');
  }
  renderStore.rerender(input, params);
}

export function getContext<
  RscContext extends Record<string, unknown> = Record<string, unknown>,
>(): RscContext {
  const renderStorage = getGlobalCacheForPlatform();
  const renderStore = renderStorage.getStore() ?? currentRenderStore;
  if (!renderStore) {
    throw new Error('Render store is not available for accessing context');
  }
  return renderStore.context as RscContext;
}

/** Get the request headers used to make the server component or action request. */
export async function unstable_headers(): Promise<Headers> {
  const headers = (getContext()[REQUEST_HEADERS] || {}) as Record<string, string>;
  return new ReadonlyHeaders(headers);
}

class ReadonlyHeaders extends Headers {
  set() {
    throw new Error('Server component Headers are read-only');
  }
  append() {
    throw new Error('Server component Headers are read-only');
  }
  delete() {
    throw new Error('Server component Headers are read-only');
  }
}
