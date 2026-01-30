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
