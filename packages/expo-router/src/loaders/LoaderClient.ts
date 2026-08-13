type LoaderFetcher = (path: string, requestInit: RequestInit) => Promise<unknown>;
export type LoaderResult = { data: unknown } | { error: unknown };
type LoaderSubscriber = (result: LoaderResult, isCurrentSource: boolean) => void;
export type LoaderUnsubscribe = (onSourceTeardown?: () => void) => void;

interface LoaderSubscription {
  callback: LoaderSubscriber;
  committed: boolean;
}

interface LoaderSource {
  subscribers: Set<LoaderSubscription>;
  controller: AbortController | null;
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

  subscribeLoader(
    path: string,
    callback: LoaderSubscriber = () => {},
    { committed = false }: { committed?: boolean } = {}
  ): LoaderUnsubscribe {
    const source = this.getOrCreateSource(path);
    const subscription = { callback, committed };
    source.onTeardown = undefined;
    source.subscribers.add(subscription);

    let subscribed = true;
    return (onSourceTeardown) => {
      if (!subscribed) {
        return;
      }
      subscribed = false;
      source.subscribers.delete(subscription);
      if (source.subscribers.size === 0) {
        this.scheduleTeardown(path, source, onSourceTeardown);
      }
    };
  }

  registerFetcher(path: string, fetcher: LoaderFetcher) {
    this.fetchers.set(path, fetcher);
  }

  /** Aborts and detaches a source unless a committed reader still owns it. */
  abort(path: string): boolean {
    const source = this.active.get(path);
    if (!source || hasCommittedSubscription(source)) {
      return false;
    }

    // Detach before aborting because an abort listener may synchronously start replacement work.
    this.active.delete(path);
    source.onTeardown = undefined;
    source.subscribers.clear();
    this.abortSourceRequest(source);
    return true;
  }

  execute(path: string, fetcher?: LoaderFetcher): void {
    if (fetcher) {
      this.fetchers.set(path, fetcher);
    }
    const source = this.active.get(path);
    const fetcherFn = this.fetchers.get(path);
    if (!source || !fetcherFn || source.controller) {
      return;
    }

    const controller = new AbortController();
    source.controller = controller;

    let request: Promise<unknown>;
    try {
      request = fetcherFn(path, { signal: controller.signal });
    } catch (error) {
      request = Promise.reject(error);
    }

    request.then(
      (data) => this.settle(path, source, controller, { data }),
      (error) =>
        this.settle(path, source, controller, {
          error: new Error(`Failed to load loader data for route: ${path}`, {
            cause: error,
          }),
        })
    );
  }

  revalidate(): ReadonlySet<string> {
    const livePaths = new Set<string>();
    for (const [path, source] of this.active) {
      if (hasCommittedSubscription(source)) {
        livePaths.add(path);
        this.abortSourceRequest(source);
        this.execute(path);
      } else {
        this.active.delete(path);
        source.onTeardown = undefined;
        source.subscribers.clear();
        this.abortSourceRequest(source);
      }
    }
    return livePaths;
  }

  clear() {
    const sources = [...this.active.values()];
    this.active.clear();
    this.fetchers.clear();
    for (const source of sources) {
      source.onTeardown = undefined;
      source.subscribers.clear();
      this.abortSourceRequest(source);
    }
  }

  private getOrCreateSource(path: string): LoaderSource {
    let source = this.active.get(path);
    if (!source) {
      source = {
        subscribers: new Set(),
        controller: null,
      };
      this.active.set(path, source);
    }
    return source;
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
        this.abortSourceRequest(source);
        onSourceTeardown?.();
      }
    };
    source.onTeardown = onTeardown;
    queueMicrotask(onTeardown);
  }

  private abortSourceRequest(source: LoaderSource) {
    const controller = source.controller;
    source.controller = null;
    controller?.abort();
  }

  private settle(
    path: string,
    source: LoaderSource,
    controller: AbortController,
    result: LoaderResult
  ) {
    if (source.controller === controller) {
      source.controller = null;
    }
    if (controller.signal.aborted) {
      return;
    }

    const isCurrentSource = this.active.get(path) === source;
    for (const { callback } of source.subscribers) {
      callback(result, isCurrentSource);
    }
  }
}

function hasCommittedSubscription(source: LoaderSource): boolean {
  for (const subscription of source.subscribers) {
    if (subscription.committed) {
      return true;
    }
  }
  return false;
}
