import type { LoaderClient } from './LoaderClient';

type LoaderFetcher<T> = (path: string) => Promise<T>;

export function readLoaderData<T>(
  client: LoaderClient,
  resolvedPath: string,
  fetcher: LoaderFetcher<T>
): T | Promise<T> {
  const suspended = client.suspense.get<T>(resolvedPath);
  if (suspended instanceof Promise) {
    return suspended;
  }
  if (suspended) {
    if ('error' in suspended) {
      client.suspense.expireError(resolvedPath);
      throw suspended.error;
    }
    return suspended.data;
  }

  const promise = new Promise<T>((resolve, reject) => {
    const unsubscribe = client.subscribeLoader(resolvedPath, (result) => {
      unsubscribe();
      if ('error' in result) {
        reject(result.error);
      } else {
        resolve(result.data as T);
      }
    });
    client.execute(resolvedPath, fetcher);
  });
  client.suspense.set(resolvedPath, promise);
  return promise;
}
