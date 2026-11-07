import type { LoaderContextValue } from './LoaderContext';

type LoaderFetcher<T> = (path: string, requestInit: RequestInit) => Promise<T>;

type TrackedPromise = Promise<unknown> & {
  status?: 'pending' | 'fulfilled' | 'rejected';
};

// React records suspended thenables by identity. A replay after the loader settles must receive
// the promise it tracked, or React reports an uncached promise. Entries are only added when a
// reader is waiting, because React sets `status` on the thenable it suspends on.
const trackedPromises = new WeakMap<object, TrackedPromise>();

export function readLoaderData<T>(
  { client, store }: LoaderContextValue,
  resolvedPath: string,
  fetcher: LoaderFetcher<T>
): T | Promise<T> {
  const suspended = store.get<T>(resolvedPath);
  if (suspended instanceof Promise) {
    return suspended;
  }
  if (suspended) {
    if ('error' in suspended) {
      queueMicrotask(() => {
        if (store.get(resolvedPath) === suspended) {
          store.clear(resolvedPath);
        }
      });
      throw suspended.error;
    }
    const tracked = trackedPromises.get(suspended);
    if (tracked?.status === 'fulfilled') {
      // The promise resolved with `suspended.data`, so it is a `Promise<T>`.
      return tracked as Promise<T>;
    }
    return suspended.data;
  }

  const promise = new Promise<T>((resolve, reject) => {
    const unsubscribe = client.subscribeLoader(resolvedPath, (result, isCurrentSource) => {
      if (isCurrentSource && store.get(resolvedPath) === promise) {
        trackedPromises.set(result, promise);
        store.set(resolvedPath, result);
      }
      unsubscribe();
      if ('error' in result) {
        reject(result.error);
      } else {
        resolve(result.data as T);
      }
    });
    client.execute(resolvedPath, fetcher);
  });
  store.set(resolvedPath, promise);
  return promise;
}
