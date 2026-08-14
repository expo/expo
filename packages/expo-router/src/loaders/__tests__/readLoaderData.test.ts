import { LoaderClient } from '../LoaderClient';
import { createLoaderContextValue, type LoaderContextValue } from '../LoaderContext';
import { readLoaderData } from '../readLoaderData';

const tick = () => Promise.resolve();
const createLoaderContext = () => createLoaderContextValue(new LoaderClient());
const read = <T>(ctx: LoaderContextValue, path: string, fetcher: (path: string) => Promise<T>) =>
  readLoaderData(ctx, path, fetcher);
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
    const unsubscribe = ctx.client.subscribeLoader('/p');
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
    const unsubscribe = ctx.client.subscribeLoader('/sm');
    ctx.store.dispose('/sm');
    unsubscribe(() => ctx.store.teardown('/sm'));
    ctx.client.subscribeLoader('/sm');
    await tick();

    expect(read(ctx, '/sm', fetcher)).toBe('v1');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps a fresh result written between disposal and confirmed teardown', async () => {
    const ctx = createLoaderContext();
    ctx.store.set('/p', { data: 'old' });
    const unsubscribe = ctx.client.subscribeLoader('/p');

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

  it('lets a detached source resolve its caller without restoring reset state', async () => {
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

    ctx.client.clear();
    ctx.store.reset();
    resolveFetch('detached');

    await expect(pending).resolves.toBe('detached');
    expect(ctx.store.get('/p')).toBeUndefined();
  });

  it('does not let a replaced source overwrite the newer pending entry', async () => {
    const ctx = createLoaderContext();
    let resolveOld!: (result: string) => void;
    let resolveNew!: (result: string) => void;
    const oldPending = read(
      ctx,
      '/p',
      () =>
        new Promise<string>((resolve) => {
          resolveOld = resolve;
        })
    ) as Promise<string>;

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
    await expect(oldPending).resolves.toBe('old');
    expect(ctx.store.get('/p')).toBe(newPending);

    resolveNew('new');
    await expect(newPending).resolves.toBe('new');
    expect(ctx.store.get('/p')).toEqual({ data: 'new' });
  });

  it('keeps a settled result from an abandoned render for the next mount to adopt', async () => {
    const ctx = createLoaderContext();
    let resolveFetch!: (result: string) => void;
    const fetcher = jest.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const mountedUnsubscribe = ctx.client.subscribeLoader('/p');
    const abandoned = read(ctx, '/p', fetcher) as Promise<string>;
    ctx.store.dispose('/p');
    mountedUnsubscribe(() => ctx.store.teardown('/p'));
    await tick();

    resolveFetch('adopted');
    await expect(abandoned).resolves.toBe('adopted');

    expect(read(ctx, '/p', fetcher)).toBe('adopted');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('refreshes a live entry in place during invalidation', async () => {
    const ctx = createLoaderContext();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await read(ctx, '/p', fetcher);
    ctx.client.subscribeLoader('/p', (result, isCurrentSource) => {
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
    const sibling = ctx.client.subscribeLoader('/p');
    ctx.client.subscribeLoader('/p', (result, isCurrentSource) => {
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
});
