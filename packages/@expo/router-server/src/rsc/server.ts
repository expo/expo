/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 Daishi Kato
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { ReactNode } from 'react';

export const REQUEST_HEADERS = '__expo_requestHeaders';

declare let globalThis: {
  __EXPO_RSC_STORE__?: AsyncLocalStorage<RenderStore>;
  __webpack_chunk_load__: (id: string) => Promise<any>;
  __webpack_require__: (id: string) => any;
};

type Config = any;

type Elements = Record<string, ReactNode>;

export type BuildConfig = {
  pathname: string;
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
  dynamicHtmlPaths: [pathname: string, htmlHead: string][];
  publicIndexHtml: string;
};

type RenderStore = {
  rerender: (input: string, params?: unknown) => void;
  context: Record<string, unknown>;
};

// Stashed on globalThis so separately-loaded copies of this module (e.g. the renderer and a
// server-action module loaded via Metro's ssrLoadModule) share one storage instance.
function getRenderStorage(): AsyncLocalStorage<RenderStore> {
  return (globalThis.__EXPO_RSC_STORE__ ??= new AsyncLocalStorage<RenderStore>());
}

/**
 * This is an internal function and not for public use.
 */
export const runWithRenderStore = <T>(renderStore: RenderStore, fn: () => T): T => {
  return getRenderStorage().run(renderStore, fn);
};

export async function rerender(input: string, params?: unknown) {
  const renderStore = getRenderStorage().getStore();
  if (!renderStore) {
    throw new Error('Render store is not available for rerender');
  }
  renderStore.rerender(input, params);
}

export function getContext<
  RscContext extends Record<string, unknown> = Record<string, unknown>,
>(): RscContext {
  const renderStore = getRenderStorage().getStore();
  if (!renderStore) {
    throw new Error('Render store is not available for accessing context');
  }
  return renderStore.context as RscContext;
}
