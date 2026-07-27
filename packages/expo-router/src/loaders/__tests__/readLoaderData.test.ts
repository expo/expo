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

  it('serves a document-cache hit without fetching', () => {
    const cache = new LoaderCache();
    const fetcher = jest.fn();
    cache.setData('/p', 'cached');

    expect(readLoaderData(cache, '/p', fetcher)).toBe('cached');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('reuses the document cache on a revisit after the Suspense entry is reclaimed', async () => {
    const cache = new LoaderCache();
    const fetcher = jest.fn(async () => 'v1');

    await readLoaderData(cache, '/p', fetcher);
    expect(readLoaderData(cache, '/p', fetcher)).toBe('v1');

    cache.suspense.retain('/p');
    cache.suspense.release('/p');
    await tick();
    expect(cache.suspense.get('/p')).toBeUndefined();

    expect(readLoaderData(cache, '/p', fetcher)).toBe('v1');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns the same in-flight promise to concurrent reads', () => {
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

  it('keeps the value across an unmount + remount within the same tick (Strict Mode safe)', async () => {
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
