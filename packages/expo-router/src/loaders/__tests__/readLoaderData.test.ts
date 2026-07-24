import { LoaderCache } from '../LoaderCache';
import { readLoaderData } from '../readLoaderData';

const tick = () => Promise.resolve();

describe(readLoaderData, () => {
  it('fetches once, then reuses the value across re-renders', async () => {
    const cache = new LoaderCache();
    const fetcher = jest.fn(async () => 'v1');

    const pending = readLoaderData(cache, '/p', fetcher);
    expect(pending).toBeInstanceOf(Promise);
    await pending;

    for (let i = 0; i < 5; i++) {
      expect(readLoaderData(cache, '/p', fetcher)).toBe('v1');
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('fetches again on a fresh mount after the Suspense entry is reclaimed', async () => {
    const cache = new LoaderCache();
    const fetcher = jest
      .fn<Promise<string>, [string]>()
      .mockResolvedValueOnce('v1')
      .mockResolvedValueOnce('v2');

    await readLoaderData(cache, '/p', fetcher);
    expect(readLoaderData(cache, '/p', fetcher)).toBe('v1');

    cache.suspense.retain('/p');
    cache.suspense.release('/p');
    await tick();
    expect(cache.suspense.get('/p')).toBeUndefined();

    const revisit = readLoaderData(cache, '/p', fetcher);
    expect(revisit).toBeInstanceOf(Promise);
    await expect(revisit).resolves.toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('fetches exactly once when Suspense replays a cache-miss mount', () => {
    const cache = new LoaderCache();
    const fetcher = jest.fn(async () => 'v1');

    const first = readLoaderData(cache, '/p', fetcher);
    const second = readLoaderData(cache, '/p', fetcher);

    expect(first).toBeInstanceOf(Promise);
    expect(second).toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('caches a fetch error and re-throws it without retrying', async () => {
    const cache = new LoaderCache();
    const fetcherError = new Error('boom');
    const fetcher = jest.fn(async () => {
      throw fetcherError;
    });

    const pending = readLoaderData(cache, '/err', fetcher);
    await expect(pending).rejects.toThrow('Failed to load loader data for route: /err');
    expect(cache.getError('/err')?.cause).toBe(fetcherError);

    expect(() => readLoaderData(cache, '/err', fetcher)).toThrow(
      'Failed to load loader data for route: /err'
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not double-fetch across a StrictMode unmount + remount within the same tick', async () => {
    const cache = new LoaderCache();
    const fetcher = jest.fn(async () => 'v1');

    await readLoaderData(cache, '/sm', fetcher);
    cache.suspense.retain('/sm');
    cache.suspense.release('/sm');
    cache.suspense.retain('/sm');
    await tick();

    expect(readLoaderData(cache, '/sm', fetcher)).toBe('v1');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
