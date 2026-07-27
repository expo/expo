import type { LoaderCache } from './LoaderCache';

type LoaderFetcher<T> = (path: string) => Promise<T>;

/**
 * Cache-first read for `useLoaderData`. Reads the per-mount Suspense store first, so a re-render
 * returns the settled value or the in-flight promise rather than starting another fetch.
 */
export function readLoaderData<T>(
  cache: LoaderCache,
  resolvedPath: string,
  fetcher: LoaderFetcher<T>
): T | Promise<T> {
  const suspended = cache.suspense.get<T>(resolvedPath);
  if (suspended instanceof Promise) {
    return suspended;
  }
  if (suspended) {
    return suspended.data;
  }

  const cachedError = cache.getError(resolvedPath);
  if (cachedError) {
    throw cachedError;
  }

  if (cache.hasData(resolvedPath)) {
    const data = cache.getData<T>(resolvedPath) as T;
    cache.suspense.set(resolvedPath, { data });
    return data;
  }

  const promise = fetchIntoCache(cache, resolvedPath, fetcher).then(
    (data) => {
      cache.suspense.set(resolvedPath, { data });
      return data;
    },
    (error) => {
      // The error is held in the cache; dropping the store entry lets a re-read re-throw it.
      cache.suspense.clear(resolvedPath);
      throw error;
    }
  );
  cache.suspense.set(resolvedPath, promise);
  return promise;
}

/** Fetch and write the result into the cache, deduped via its promise map. */
function fetchIntoCache<T>(
  cache: LoaderCache,
  path: string,
  fetcher: LoaderFetcher<T>
): Promise<T> {
  const inFlight = cache.getPromise<T>(path);
  if (inFlight) {
    return inFlight;
  }

  const promise = fetcher(path)
    .then((data) => {
      cache.setData(path, data);
      cache.deleteError(path);
      cache.deletePromise(path);
      return data;
    })
    .catch((error) => {
      const wrappedError = new Error(`Failed to load loader data for route: ${path}`, {
        cause: error,
      });
      cache.setError(path, wrappedError);
      cache.deleteData(path);
      cache.deletePromise(path);
      throw wrappedError;
    });

  cache.setPromise(path, promise);
  return promise;
}
