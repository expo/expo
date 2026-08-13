import { LoaderClient } from '../LoaderClient';
import { createLoaderContextValue, type LoaderContextValue } from '../LoaderContext';
import { readLoaderData } from '../readLoaderData';

const tick = () => Promise.resolve();
const createLoaderContext = () => createLoaderContextValue(new LoaderClient());
const subscribeCommitted = (
  { client }: LoaderContextValue,
  path: string,
  callback?: Parameters<LoaderClient['subscribeLoader']>[1]
) => client.subscribeLoader(path, callback, { committed: true });
const read = <T>(
  ctx: LoaderContextValue,
  path: string,
  fetcher: (path: string, requestInit: RequestInit) => Promise<T>
) => readLoaderData(ctx, path, fetcher);
const revalidate = ({ client, store }: LoaderContextValue) => {
  store.retain(client.revalidate());
};

describe(readLoaderData, () => {
  it('fetches once and reuses the settled value across reads', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest.fn(async () => 'v1');

    const pending = read(ctx, '/p', fetcher);
    expect(pending).toBeInstanceOf(Promise);
    await pending;

    for (let i = 0; i < 5; i++) {
      expect(read(ctx, '/p', fetcher)).toBe('v1');
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('shares one promise and one fetch between concurrent readers', () => {
    const ctx = createLoaderContext();
    const fetcher = jest.fn(async () => 'v1');

    const first = read(ctx, '/p', fetcher);
    const second = read(ctx, '/p', fetcher);

    expect(first).toBeInstanceOf(Promise);
    expect(second).toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('writes the settled result before resolving the Suspense promise', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest.fn(async () => 'v1');
    const pending = read(ctx, '/p', fetcher) as Promise<string>;

    await pending.then((result) => {
      expect(result).toBe('v1');
      expect(ctx.store.get('/p')).toEqual({ data: 'v1' });
    });
  });

  it('fetches again on a fresh mount after confirmed teardown', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await read(ctx, '/p', fetcher);
    const unsubscribe = subscribeCommitted(ctx, '/p');
    ctx.store.dispose('/p');
    unsubscribe(() => ctx.store.teardown('/p'));
    await tick();

    expect(ctx.store.get('/p')).toBeUndefined();
    const revisit = read(ctx, '/p', fetcher);
    expect(revisit).toBeInstanceOf(Promise);
    await expect(revisit).resolves.toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('reuses the entry across a same-tick Strict Mode remount', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest.fn(async () => 'v1');

    await read(ctx, '/sm', fetcher);
    const unsubscribe = subscribeCommitted(ctx, '/sm');
    ctx.store.dispose('/sm');
    unsubscribe(() => ctx.store.teardown('/sm'));
    subscribeCommitted(ctx, '/sm');
    await tick();

    expect(read(ctx, '/sm', fetcher)).toBe('v1');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps a fresh result written between disposal and confirmed teardown', async () => {
    const ctx = createLoaderContext();
    ctx.store.set('/p', { data: 'old' });
    const unsubscribe = subscribeCommitted(ctx, '/p');

    ctx.store.dispose('/p');
    unsubscribe(() => ctx.store.teardown('/p'));
    ctx.store.set('/p', { data: 'fresh' });
    await tick();

    expect(ctx.store.get('/p')).toEqual({ data: 'fresh' });
  });

  it('throws a cached error once, then clears it so retry refetches', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('recovered');

    await expect(read(ctx, '/err', fetcher)).rejects.toThrow(
      'Failed to load loader data for route: /err'
    );
    expect(() => read(ctx, '/err', fetcher)).toThrow('Failed to load loader data for route: /err');
    expect(fetcher).toHaveBeenCalledTimes(1);

    await tick();
    expect(ctx.store.get('/err')).toBeUndefined();

    const retry = read(ctx, '/err', fetcher);
    expect(retry).toBeInstanceOf(Promise);
    await expect(retry).resolves.toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not clear an entry replaced before deferred error eviction', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest.fn<Promise<string>, [string]>().mockRejectedValueOnce(new Error('boom'));

    await expect(read(ctx, '/err', fetcher)).rejects.toThrow();
    expect(() => read(ctx, '/err', fetcher)).toThrow();

    ctx.store.set('/err', { data: 'fresh' });
    await tick();

    expect(ctx.store.get('/err')).toEqual({ data: 'fresh' });
  });

  it('does not overwrite an entry replaced while its loader is in flight', async () => {
    const ctx = createLoaderContext();
    let resolveFetch!: (result: string) => void;
    const pending = read(
      ctx,
      '/p',
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        })
    ) as Promise<string>;

    ctx.store.set('/p', { data: 'fresh' });
    resolveFetch('stale');
    await expect(pending).resolves.toBe('stale');

    expect(ctx.store.get('/p')).toEqual({ data: 'fresh' });
  });

  it('does not resurrect a cleared entry when its pending result settles', async () => {
    const ctx = createLoaderContext();
    let resolveFetch!: (result: string) => void;
    const pending = read(
      ctx,
      '/p',
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        })
    ) as Promise<string>;

    ctx.store.clear('/p');
    resolveFetch('orphaned');
    await expect(pending).resolves.toBe('orphaned');

    expect(ctx.store.get('/p')).toBeUndefined();
  });

  it('does not restore reset state when an aborted fetcher later resolves', async () => {
    const ctx = createLoaderContext();
    let resolveFetch!: (result: string) => void;
    read(
      ctx,
      '/p',
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        })
    );

    ctx.client.clear();
    ctx.store.reset();
    resolveFetch('detached');
    await tick();

    expect(ctx.store.get('/p')).toBeUndefined();
  });

  it('keeps intentional abort pending without caching an error or emitting an unhandled rejection', async () => {
    const ctx = createLoaderContext();
    const onUnhandledRejection = jest.fn();
    process.on('unhandledRejection', onUnhandledRejection);

    try {
      const pending = read(
        ctx,
        '/p',
        (_path, requestInit) =>
          new Promise<string>((_resolve, reject) => {
            const signal = requestInit.signal as AbortSignal;
            signal.addEventListener('abort', () => reject(signal.reason));
          })
      ) as Promise<string>;
      let settled = false;
      pending.then(
        () => {
          settled = true;
        },
        () => {
          settled = true;
        }
      );

      ctx.client.abort('/p');
      await tick();
      await tick();

      expect(settled).toBe(false);
      expect(ctx.store.get('/p')).toBe(pending);
      expect(onUnhandledRejection).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', onUnhandledRejection);
    }
  });

  it('does not let a replaced source overwrite the newer pending entry', async () => {
    const ctx = createLoaderContext();
    let resolveOld!: (result: string) => void;
    let resolveNew!: (result: string) => void;
    read(
      ctx,
      '/p',
      () =>
        new Promise<string>((resolve) => {
          resolveOld = resolve;
        })
    );

    ctx.client.clear();
    ctx.store.reset();
    const newPending = read(
      ctx,
      '/p',
      () =>
        new Promise<string>((resolve) => {
          resolveNew = resolve;
        })
    ) as Promise<string>;

    resolveOld('old');
    await tick();
    expect(ctx.store.get('/p')).toBe(newPending);

    resolveNew('new');
    await expect(newPending).resolves.toBe('new');
    expect(ctx.store.get('/p')).toEqual({ data: 'new' });
  });

  it('starts a fresh request after an abandoned pending entry is removed', async () => {
    const ctx = createLoaderContext();
    const signals: AbortSignal[] = [];
    const fetcher = jest.fn((_path: string, requestInit: RequestInit) => {
      signals.push(requestInit.signal as AbortSignal);
      return new Promise<string>(() => {});
    });

    const first = read(ctx, '/p', fetcher);
    ctx.client.abort('/p');
    if (ctx.store.get('/p') === first) {
      ctx.store.clear('/p');
    }
    const second = read(ctx, '/p', fetcher);

    expect(second).not.toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(signals[0]!.aborted).toBe(true);
    expect(signals[1]!.aborted).toBe(false);
  });

  it('refreshes a live entry in place during invalidation', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await read(ctx, '/p', fetcher);
    subscribeCommitted(ctx, '/p', (result, isCurrentSource) => {
      if (isCurrentSource) {
        ctx.store.set('/p', result);
      }
    });

    revalidate(ctx);
    expect(read(ctx, '/p', fetcher)).toBe('v1');

    await tick();
    expect(read(ctx, '/p', fetcher)).toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps the entry when a sibling subscriber remains', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await read(ctx, '/p', fetcher);
    const sibling = subscribeCommitted(ctx, '/p');
    subscribeCommitted(ctx, '/p', (result, isCurrentSource) => {
      if (isCurrentSource) {
        ctx.store.set('/p', result);
      }
    });

    revalidate(ctx);
    ctx.store.dispose('/p');
    sibling(() => ctx.store.teardown('/p'));
    await tick();

    expect(read(ctx, '/p', fetcher)).toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('clears an inactive entry during invalidation so the next mount refetches', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await read(ctx, '/p', fetcher);
    await tick();
    revalidate(ctx);

    const revisit = read(ctx, '/p', fetcher);
    expect(revisit).toBeInstanceOf(Promise);
    await expect(revisit).resolves.toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('abandons an uncommitted pending read during invalidation', async () => {
    const ctx = createLoaderContext();
    const signals: AbortSignal[] = [];
    let resolveFirst!: (value: string) => void;
    let resolveSecond!: (value: string) => void;
    const fetcher = jest.fn((_path: string, requestInit: RequestInit) => {
      signals.push(requestInit.signal as AbortSignal);
      return new Promise<string>((resolve) => {
        if (signals.length === 1) {
          resolveFirst = resolve;
        } else {
          resolveSecond = resolve;
        }
      });
    });
    const first = read(ctx, '/pending', fetcher);

    revalidate(ctx);

    expect(signals[0]!.aborted).toBe(true);
    expect(ctx.store.get('/pending')).toBeUndefined();

    const second = read(ctx, '/pending', fetcher);
    expect(second).not.toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(signals[1]!.aborted).toBe(false);

    resolveFirst('pre-edit');
    await tick();
    expect(ctx.store.get('/pending')).toBe(second);

    resolveSecond('post-edit');
    await expect(second).resolves.toBe('post-edit');
    expect(ctx.store.get('/pending')).toEqual({ data: 'post-edit' });
  });
});
