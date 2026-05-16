/**
 * Copyright © 2026 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { createContext } from 'react';

export class LoaderCache {
  private data = new Map<string, unknown>();
  private errors = new Map<string, Error>();
  private promises = new Map<string, Promise<unknown>>();
  private version = 0;
  private listeners = new Set<() => void>();

  // Arrow-bound so `loaderCache.subscribe` returns a stable reference across renders,
  // which keeps `useSyncExternalStore()` from tearing down and re-attaching every render.
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): number => {
    return this.version;
  };

  invalidateAll() {
    this.clear();
    this.version++;
    for (const listener of this.listeners) {
      listener();
    }
  }

  getData<T = unknown>(path: string): T | undefined {
    return this.data.get(path) as T | undefined;
  }

  hasData(path: string) {
    return this.data.has(path);
  }

  getError(path: string): Error | undefined {
    return this.errors.get(path);
  }

  getPromise<T = unknown>(path: string): Promise<T> | undefined {
    return this.promises.get(path) as Promise<T> | undefined;
  }

  setData(path: string, value: unknown) {
    this.data.set(path, value);
  }

  deleteData(path: string) {
    this.data.delete(path);
  }

  setError(path: string, error: Error) {
    this.errors.set(path, error);
  }

  deleteError(path: string) {
    this.errors.delete(path);
  }

  setPromise(path: string, promise: Promise<unknown>) {
    this.promises.set(path, promise);
  }

  deletePromise(path: string) {
    this.promises.delete(path);
  }

  clear() {
    this.data.clear();
    this.errors.clear();
    this.promises.clear();
  }
}

export const defaultLoaderCache = new LoaderCache();
export const LoaderCacheContext = createContext<LoaderCache>(defaultLoaderCache);

// On `loader-invalidate`, drop the server-injected initial data so `useLoaderData()` falls through
// to a fresh fetch, then bump the cache version so subscribed hooks re-render.
if (__DEV__ && typeof window !== 'undefined') {
  globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__ ??= [];

  if (!globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__) {
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__ = true;
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__.push(() => {
      delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
      defaultLoaderCache.invalidateAll();
    });
  }
}
