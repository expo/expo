import type { LoaderContextValue } from './LoaderContext';

type LoaderFetcher<T> = (path: string, requestInit: RequestInit) => Promise<T>;

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
    return suspended.data;
  }

  // Like urql's Suspense integration, this render-time subscription waits only for request
  // completion. It is not a committed reader and therefore does not prevent route abandonment.
  const promise = new Promise<T>((resolve, reject) => {
    const unsubscribe = client.subscribeLoader(resolvedPath, (result, isCurrentSource) => {
      if (isCurrentSource && store.get(resolvedPath) === promise) {
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
