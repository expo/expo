import { createContext } from 'react';

import { LoaderSuspenseStore } from './LoaderSuspenseStore';

type LoaderFetcher = (path: string) => Promise<unknown>;
type LoaderResult = { data: unknown } | { error: unknown };
type LoaderSubscriber = (result: LoaderResult) => void;

interface LoaderSource {
  subscribers: Set<LoaderSubscriber>;
  fetching: boolean;
  ending: boolean;
}

export class LoaderClient {
  private active = new Map<string, LoaderSource>();
  private fetchers = new Map<string, LoaderFetcher>();
  private version = 0;
  private listeners = new Set<() => void>();

  readonly suspense = new LoaderSuspenseStore();

  // Arrow-bound so `loaderClient.subscribe` returns a stable reference across renders,
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

  notify() {
    this.version++;
    for (const listener of this.listeners) {
      listener();
    }
  }

  subscribeLoader(path: string, callback: LoaderSubscriber = () => {}): () => void {
    let source = this.active.get(path);
    if (!source) {
      source = { subscribers: new Set(), fetching: false, ending: false };
      this.active.set(path, source);
    }
    source.ending = false;
    source.subscribers.add(callback);

    let subscribed = true;
    return () => {
      if (!subscribed) {
        return;
      }
      subscribed = false;
      source.subscribers.delete(callback);
      if (source.subscribers.size === 0) {
        this.scheduleTeardown(path, source);
      }
    };
  }

  registerFetcher(path: string, fetcher: LoaderFetcher) {
    this.fetchers.set(path, fetcher);
  }

  execute(path: string, fetcher?: LoaderFetcher) {
    if (fetcher) {
      this.fetchers.set(path, fetcher);
    }
    const source = this.active.get(path);
    const fetcherFn = this.fetchers.get(path);
    if (!source || !fetcherFn || source.fetching) {
      return;
    }

    source.fetching = true;
    fetcherFn(path).then(
      (data) => this.settle(path, source, { data }),
      (error) =>
        this.settle(path, source, {
          error: new Error(`Failed to load loader data for route: ${path}`, { cause: error }),
        })
    );
  }

  invalidateAll() {
    for (const [path, source] of this.active) {
      if (source.subscribers.size > 0) {
        this.execute(path);
      }
    }
    for (const path of this.suspense.keys()) {
      const source = this.active.get(path);
      if (!source || source.subscribers.size === 0) {
        this.suspense.clear(path);
      }
    }
    this.notify();
  }

  consumeHydrationData(path: string) {
    const hydrationData = globalThis.__EXPO_ROUTER_LOADER_DATA__;
    if (!hydrationData || !(path in hydrationData)) {
      return;
    }

    this.suspense.seed(path, hydrationData[path]);
    delete hydrationData[path];
  }

  clear() {
    this.active.clear();
    this.fetchers.clear();
    this.suspense.reset();
  }

  private scheduleTeardown(path: string, source: LoaderSource) {
    source.ending = true;
    queueMicrotask(() => {
      if (source.ending && source.subscribers.size === 0 && this.active.get(path) === source) {
        this.active.delete(path);
        this.suspense.teardown(path);
      }
    });
  }

  private settle(path: string, source: LoaderSource, result: LoaderResult) {
    source.fetching = false;
    if (this.active.get(path) === source) {
      this.suspense.set(path, result);
    }
    for (const subscriber of source.subscribers) {
      subscriber(result);
    }
    this.notify();
  }
}

export const defaultLoaderClient = new LoaderClient();
export const LoaderClientContext = createContext<LoaderClient>(defaultLoaderClient);

// On `loader-invalidate`, drop the server-injected initial data so `useLoaderData()` falls through
// to a fresh fetch, then refresh live readers in place and clear unwatched entries.
if (__DEV__ && typeof window !== 'undefined') {
  globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__ ??= [];

  if (!globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__) {
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENER_REGISTERED__ = true;
    globalThis.__EXPO_LOADER_INVALIDATE_LISTENERS__.push(() => {
      delete globalThis.__EXPO_ROUTER_LOADER_DATA__;
      defaultLoaderClient.invalidateAll();
    });
  }
}
