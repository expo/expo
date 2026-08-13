import { LoaderClient } from '../LoaderClient';

const tick = () => Promise.resolve();
const getSignal = (requestInit: RequestInit) => requestInit.signal as AbortSignal;

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, reject, resolve };
}

describe(LoaderClient, () => {
  describe('subscribeLoader + execute', () => {
    it('shares one in-flight fetch and delivers it to every subscriber', async () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');
      const events: unknown[] = [];
      client.subscribeLoader('/p', (result, isCurrentSource) => {
        events.push(['first', result, isCurrentSource]);
      });
      client.subscribeLoader('/p', (result, isCurrentSource) => {
        events.push(['second', result, isCurrentSource]);
      });

      client.execute('/p', fetcher);
      client.execute('/p', fetcher);
      await tick();

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(events).toEqual([
        ['first', { data: 'v1' }, true],
        ['second', { data: 'v1' }, true],
      ]);
    });

    it('does not execute a fetcher for a path without a source', () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');

      client.execute('/p', fetcher);

      expect(fetcher).not.toHaveBeenCalled();
    });

    it('wraps fetch rejections with the route path', async () => {
      const client = new LoaderClient();
      const results: ({ data: unknown } | { error: unknown })[] = [];

      client.subscribeLoader('/err', (result) => results.push(result));
      client.execute('/err', async () => {
        throw new Error('boom');
      });
      await tick();

      const result = results[0];
      expect(result).toEqual({ error: expect.any(Error) });
      const error = (result as { error: Error }).error;
      expect(error.message).toBe('Failed to load loader data for route: /err');
      expect(error.cause).toEqual(new Error('boom'));
    });

    it('does not publish results from a cleared source', async () => {
      const client = new LoaderClient();
      let resolveFetch!: (value: string) => void;
      const subscriber = jest.fn();

      client.subscribeLoader('/p', subscriber);
      client.execute(
        '/p',
        () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve;
          })
      );
      client.clear();
      resolveFetch('stale');
      await tick();

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('passes a fresh signal to every replacement execution', async () => {
      const client = new LoaderClient();
      const signals: AbortSignal[] = [];
      const fetcher = jest.fn(async (_path: string, requestInit: RequestInit) => {
        signals.push(getSignal(requestInit));
        return signals.length;
      });
      client.subscribeLoader('/p');

      client.execute('/p', fetcher);
      await tick();
      expect(client.abort('/p')).toBe(true);
      client.subscribeLoader('/p');
      client.execute('/p', fetcher);
      await tick();

      expect(signals).toHaveLength(2);
      expect(signals[0]).not.toBe(signals[1]);
    });
  });

  describe('abort', () => {
    it('allows a render-time subscription to be aborted', () => {
      const client = new LoaderClient();
      let signal!: AbortSignal;
      client.subscribeLoader('/p');
      client.execute('/p', (_path, requestInit) => {
        signal = getSignal(requestInit);
        return new Promise(() => {});
      });

      expect(client.abort('/p')).toBe(true);
      expect(signal.aborted).toBe(true);
    });

    it('refuses to abort while a committed subscription remains', () => {
      const client = new LoaderClient();
      let signal!: AbortSignal;
      client.subscribeLoader('/p', undefined, { committed: true });
      client.execute('/p', (_path, requestInit) => {
        signal = getSignal(requestInit);
        return new Promise(() => {});
      });

      expect(client.abort('/p')).toBe(false);
      expect(signal.aborted).toBe(false);
    });

    it('detaches the source before abort listeners run', async () => {
      const client = new LoaderClient();
      const oldRequest = createDeferred<string>();
      let oldSignal!: AbortSignal;
      const replacementSubscriber = jest.fn();
      client.subscribeLoader('/p');
      client.execute('/p', (_path, requestInit) => {
        oldSignal = getSignal(requestInit);
        oldSignal.addEventListener('abort', () => {
          client.subscribeLoader('/p', replacementSubscriber);
          client.execute('/p', async () => 'replacement');
          oldRequest.reject(oldSignal.reason);
        });
        return oldRequest.promise;
      });

      expect(client.abort('/p')).toBe(true);
      await tick();

      expect(oldSignal.aborted).toBe(true);
      expect(replacementSubscriber).toHaveBeenCalledWith({ data: 'replacement' }, true);
    });

    it('does not publish an intentional abort as a route error', async () => {
      const client = new LoaderClient();
      const subscriber = jest.fn();
      client.subscribeLoader('/p', subscriber);
      client.execute('/p', (_path, requestInit) => {
        const signal = getSignal(requestInit);
        return new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason));
        });
      });

      expect(client.abort('/p')).toBe(true);
      await tick();

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('keeps a fetcher that ignores abort stale after a replacement starts', async () => {
      const client = new LoaderClient();
      const oldRequest = createDeferred<string>();
      const oldSubscriber = jest.fn();
      const replacementSubscriber = jest.fn();
      client.subscribeLoader('/p', oldSubscriber);
      client.execute('/p', () => oldRequest.promise);

      expect(client.abort('/p')).toBe(true);
      client.subscribeLoader('/p', replacementSubscriber);
      client.execute('/p', async () => 'fresh');
      oldRequest.resolve('stale');
      await tick();

      expect(oldSubscriber).not.toHaveBeenCalled();
      expect(replacementSubscriber).toHaveBeenCalledTimes(1);
      expect(replacementSubscriber).toHaveBeenCalledWith({ data: 'fresh' }, true);
    });

    it('returns false for an unknown path', () => {
      const client = new LoaderClient();

      expect(client.abort('/missing')).toBe(false);
    });
  });

  describe('teardown', () => {
    it('calls onTearDown after the last unsubscribe', async () => {
      const client = new LoaderClient();
      const onTearDown = jest.fn();
      const unsubscribe = client.subscribeLoader('/p');

      unsubscribe(onTearDown);
      expect(onTearDown).not.toHaveBeenCalled();
      await tick();

      expect(onTearDown).toHaveBeenCalledTimes(1);
    });

    it('does not call onTearDown while a sibling subscriber remains', async () => {
      const client = new LoaderClient();
      const onTearDown = jest.fn();
      const first = client.subscribeLoader('/p');
      client.subscribeLoader('/p');

      first(onTearDown);
      await tick();

      expect(onTearDown).not.toHaveBeenCalled();
    });

    it('cancels a pending onTearDown on remount and does not retain it for later teardown', async () => {
      const client = new LoaderClient();
      const cancelledOnTearDown = jest.fn();
      const laterOnTearDown = jest.fn();
      const first = client.subscribeLoader('/p');

      first(cancelledOnTearDown);
      const second = client.subscribeLoader('/p');
      await tick();

      expect(cancelledOnTearDown).not.toHaveBeenCalled();
      second(laterOnTearDown);
      await tick();

      expect(cancelledOnTearDown).not.toHaveBeenCalled();
      expect(laterOnTearDown).toHaveBeenCalledTimes(1);
    });

    it('does not let a cancelled attempt run a later teardown with the same onTearDown', async () => {
      const client = new LoaderClient();
      const events: string[] = [];
      const onTearDown = () => events.push('onTearDown');
      const first = client.subscribeLoader('/p');

      first(onTearDown);
      const second = client.subscribeLoader('/p');
      queueMicrotask(() => events.push('between'));
      second(onTearDown);
      await tick();

      expect(events).toEqual(['between', 'onTearDown']);
    });

    it('does not deliver a result after the subscriber tears down', async () => {
      const client = new LoaderClient();
      let resolveFetch!: (value: string) => void;
      const subscriber = jest.fn();

      const unsubscribe = client.subscribeLoader('/p', subscriber);
      client.execute(
        '/p',
        () =>
          new Promise<string>((resolve) => {
            resolveFetch = resolve;
          })
      );
      unsubscribe();
      await tick();

      resolveFetch('stale');
      await tick();

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('aborts pending work after the final subscriber teardown is confirmed', async () => {
      const client = new LoaderClient();
      let signal!: AbortSignal;
      const unsubscribe = client.subscribeLoader('/p', undefined, { committed: true });
      client.execute('/p', (_path, requestInit) => {
        signal = getSignal(requestInit);
        return new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason));
        });
      });

      unsubscribe();
      expect(signal.aborted).toBe(false);
      await tick();

      expect(signal.aborted).toBe(true);
    });
  });

  describe('revalidate', () => {
    it('re-executes paths with live subscribers and returns their paths', async () => {
      const client = new LoaderClient();
      const fetcher = jest
        .fn<Promise<string>, [string]>()
        .mockResolvedValueOnce('v1')
        .mockResolvedValueOnce('v2');
      const results: unknown[] = [];

      client.subscribeLoader('/p', (result) => results.push(result), { committed: true });
      client.execute('/p', fetcher);
      await tick();

      const inactive = client.subscribeLoader('/inactive');
      const inactiveFetcher = jest.fn(async () => 'unused');
      client.registerFetcher('/inactive', inactiveFetcher);
      inactive();
      const livePaths = client.revalidate();
      await tick();

      expect(livePaths).toEqual(new Set(['/p']));
      expect(results).toEqual([{ data: 'v1' }, { data: 'v2' }]);
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(inactiveFetcher).not.toHaveBeenCalled();
    });

    it('re-executes a registered fetcher for a live hydration-seeded path', async () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'post-edit');
      const subscriber = jest.fn();

      client.subscribeLoader('/index', subscriber, { committed: true });
      client.registerFetcher('/index', fetcher);
      const livePaths = client.revalidate();
      await tick();

      expect(livePaths).toEqual(new Set(['/index']));
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith({ data: 'post-edit' }, true);
    });

    it('aborts and replaces an in-flight request for committed readers', async () => {
      const client = new LoaderClient();
      const signals: AbortSignal[] = [];
      const requests = [createDeferred<string>(), createDeferred<string>()];
      const subscriber = jest.fn();
      const fetcher = jest.fn((_path: string, requestInit: RequestInit) => {
        signals.push(getSignal(requestInit));
        return requests[signals.length - 1]!.promise;
      });
      client.subscribeLoader('/p', subscriber, { committed: true });
      client.execute('/p', fetcher);

      const livePaths = client.revalidate();

      expect(livePaths).toEqual(new Set(['/p']));
      expect(signals).toHaveLength(2);
      expect(signals[0]!.aborted).toBe(true);
      expect(signals[1]!.aborted).toBe(false);

      requests[0]!.resolve('pre-edit');
      await tick();
      expect(subscriber).not.toHaveBeenCalled();

      requests[1]!.resolve('post-edit');
      await tick();
      expect(subscriber).toHaveBeenCalledWith({ data: 'post-edit' }, true);
    });

    it('detaches uncommitted pending work so the next render starts fresh', async () => {
      const client = new LoaderClient();
      const signals: AbortSignal[] = [];
      const requests = [createDeferred<string>(), createDeferred<string>()];
      const oldSubscriber = jest.fn();
      const newSubscriber = jest.fn();
      const fetcher = jest.fn((_path: string, requestInit: RequestInit) => {
        signals.push(getSignal(requestInit));
        return requests[signals.length - 1]!.promise;
      });
      client.subscribeLoader('/pending', oldSubscriber);
      client.execute('/pending', fetcher);

      expect(client.revalidate()).toEqual(new Set());
      client.subscribeLoader('/pending', newSubscriber);
      client.execute('/pending', fetcher);

      expect(signals).toHaveLength(2);
      expect(signals[0]!.aborted).toBe(true);
      expect(signals[1]!.aborted).toBe(false);

      requests[0]!.resolve('pre-edit');
      await tick();
      expect(oldSubscriber).not.toHaveBeenCalled();
      requests[1]!.resolve('post-edit');
      await tick();
      expect(newSubscriber).toHaveBeenCalledWith({ data: 'post-edit' }, true);
    });
  });

  describe('clear', () => {
    it('aborts every active execution despite committed readers', () => {
      const client = new LoaderClient();
      const signals: AbortSignal[] = [];
      for (let index = 0; index < 2; index++) {
        client.subscribeLoader(`/${index}`, undefined, { committed: true });
        client.execute(`/${index}`, (_path, requestInit) => {
          signals.push(getSignal(requestInit));
          return new Promise(() => {});
        });
      }

      client.clear();

      expect(signals.every((signal) => signal.aborted)).toBe(true);
    });

    it('drops registered fetchers and cancels queued teardown', async () => {
      const client = new LoaderClient();
      const fetcher = jest.fn(async () => 'v1');
      const onTeardown = jest.fn();
      client.registerFetcher('/p', fetcher);
      const unsubscribe = client.subscribeLoader('/p');
      unsubscribe(onTeardown);

      client.clear();
      client.subscribeLoader('/p');
      client.execute('/p');
      await tick();

      expect(fetcher).not.toHaveBeenCalled();
      expect(onTeardown).not.toHaveBeenCalled();
    });
  });
});
