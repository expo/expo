type LoaderFetcher = (path: string) => Promise<unknown>;
export type LoaderResult = { data: unknown } | { error: unknown };
type LoaderSubscriber = (result: LoaderResult, isCurrentSource: boolean) => void;
export type LoaderUnsubscribe = (onSourceTeardown?: () => void) => void;

interface LoaderSource {
  subscribers: Set<LoaderSubscriber>;
  isFetching: boolean;
  onTeardown?: () => void;
}

/**
 * Coordinates loader execution, deduplication, and source subscriptions.
 *
 * Suspense state belongs to the React integration layer; this client must not access or mutate
 * `LoaderSuspenseStore`.
 */
export class LoaderClient {
  private active = new Map<string, LoaderSource>();
  private fetchers = new Map<string, LoaderFetcher>();

  subscribeLoader(path: string, callback: LoaderSubscriber = () => {}): LoaderUnsubscribe {
    let source = this.active.get(path);
    if (!source) {
      source = { subscribers: new Set(), isFetching: false };
      this.active.set(path, source);
    }
    source.onTeardown = undefined;
    source.subscribers.add(callback);

    let subscribed = true;
    return (onSourceTeardown) => {
      if (!subscribed) {
        return;
      }
      subscribed = false;
      source.subscribers.delete(callback);
      if (source.subscribers.size === 0) {
        this.scheduleTeardown(path, source, onSourceTeardown);
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
    if (!source || !fetcherFn || source.isFetching) {
      return;
    }

    source.isFetching = true;
    fetcherFn(path).then(
      (data) => this.settle(path, source, { data }),
      (error) =>
        this.settle(path, source, {
          error: new Error(`Failed to load loader data for route: ${path}`, {
            cause: error,
          }),
        })
    );
  }

  revalidate(): ReadonlySet<string> {
    const livePaths = new Set<string>();
    for (const [path, source] of this.active) {
      if (source.subscribers.size > 0) {
        livePaths.add(path);
        this.execute(path);
      }
    }
    return livePaths;
  }

  clear() {
    this.active.clear();
    this.fetchers.clear();
  }

  private scheduleTeardown(path: string, source: LoaderSource, onSourceTeardown?: () => void) {
    const onTeardown = () => {
      if (
        source.onTeardown === onTeardown &&
        source.subscribers.size === 0 &&
        this.active.get(path) === source
      ) {
        this.active.delete(path);
        source.onTeardown = undefined;
        onSourceTeardown?.();
      }
    };
    source.onTeardown = onTeardown;
    queueMicrotask(onTeardown);
  }

  private settle(path: string, source: LoaderSource, result: LoaderResult) {
    source.isFetching = false;
    const isCurrentSource = this.active.get(path) === source;
    for (const subscriber of source.subscribers) {
      subscriber(result, isCurrentSource);
    }
  }
}
