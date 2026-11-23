import type { LoaderFetcher, LoaderResult } from './types';
import { fetchLoader } from './utils';

export type { LoaderFetcher, LoaderResult } from './types';

/** Executes requests and delivers only the current request's result for each path. */
export class LoaderClient {
  private requests = new Map<string, AbortController>();

  constructor(private fetcher: LoaderFetcher = fetchLoader) {}

  start(path: string, onSettle: (result: LoaderResult) => void) {
    const previous = this.requests.get(path);
    const request = new AbortController();
    this.requests.set(path, request);
    previous?.abort();
    // An abort listener can synchronously install another replacement.
    if (this.requests.get(path) !== request) return;

    let promise: Promise<unknown>;
    try {
      promise = this.fetcher(path, { signal: request.signal });
    } catch (error) {
      promise = Promise.reject(error);
    }
    promise.then(
      (data) => this.settle(path, request, { data }, onSettle),
      (error) =>
        this.settle(
          path,
          request,
          {
            error: new Error(`Failed to load loader data for route: ${path}`, { cause: error }),
          },
          onSettle
        )
    );
  }

  isLoading(path: string) {
    return this.requests.has(path);
  }

  abort(path: string) {
    const request = this.requests.get(path);
    this.requests.delete(path);
    request?.abort();
  }

  private settle(
    path: string,
    request: AbortController,
    result: LoaderResult,
    onSettle: (result: LoaderResult) => void
  ) {
    if (this.requests.get(path) !== request) return;
    this.requests.delete(path);
    onSettle(result);
  }
}
