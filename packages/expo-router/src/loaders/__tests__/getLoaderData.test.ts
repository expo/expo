import { LoaderCache } from '../LoaderCache';
import { getLoaderData } from '../getLoaderData';

describe(getLoaderData, () => {
  it('returns cached data without calling the fetcher', () => {
    const cache = new LoaderCache();
    const fetcher = jest.fn();

    cache.setData('/test', undefined);

    const result = getLoaderData({ resolvedPath: '/test', cache, fetcher });

    expect(result).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('throws cached errors without calling the fetcher', () => {
    const cache = new LoaderCache();
    const fetcher = jest.fn();
    const error = new Error('Cached error');

    cache.setError('/test', error);

    expect(() => getLoaderData({ resolvedPath: '/test', cache, fetcher })).toThrow(error);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('starts a fetch and caches the promise when missing', async () => {
    const cache = new LoaderCache();
    const fetcher = jest.fn(async () => 'ok');

    const result = getLoaderData({ resolvedPath: '/test', cache, fetcher });

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result).toBeInstanceOf(Promise);
    expect(cache.getPromise('/test')).toBe(result);

    await expect(result).resolves.toBe('ok');
    expect(cache.getPromise('/test')).toBeUndefined();
    expect(cache.getData('/test')).toBe('ok');
  });

  it('wraps fetch errors and caches them', async () => {
    const cache = new LoaderCache();
    const fetcherError = new Error('Network failed');
    const fetcher = jest.fn(async () => {
      throw fetcherError;
    });

    const result = getLoaderData({ resolvedPath: '/test', cache, fetcher });

    await expect(result).rejects.toThrow('Failed to load loader data for route: /test');
    const cachedError = cache.getError('/test');
    expect(cachedError).toBeInstanceOf(Error);
    expect(cachedError?.cause).toBe(fetcherError);
    expect(cache.getPromise('/test')).toBeUndefined();

    expect(() => getLoaderData({ resolvedPath: '/test', cache, fetcher })).toThrow(cachedError);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
