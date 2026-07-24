import { fetchLoader, getLoaderModulePath } from '../utils';

describe(getLoaderModulePath, () => {
  it('converts root path to /_expo/loaders/index', () => {
    expect(getLoaderModulePath('/')).toBe('/_expo/loaders/index');
  });

  it('converts paths without trailing slash', () => {
    expect(getLoaderModulePath('/about')).toBe('/_expo/loaders/about');
  });

  it('strips trailing slashes', () => {
    expect(getLoaderModulePath('/about/')).toBe('/_expo/loaders/about');
  });

  it('handles nested paths', () => {
    expect(getLoaderModulePath('/posts/123')).toBe('/_expo/loaders/posts/123');
  });

  it('preserves route groups in paths', () => {
    expect(getLoaderModulePath('/(group)/index')).toBe('/_expo/loaders/(group)/index');
  });

  it('preserves query parameters', () => {
    expect(getLoaderModulePath('/request?foo=bar')).toBe('/_expo/loaders/request?foo=bar');
  });

  it('preserves query parameters on root path', () => {
    expect(getLoaderModulePath('/?foo=bar')).toBe('/_expo/loaders/index?foo=bar');
  });

  it('preserves multiple query parameters', () => {
    expect(getLoaderModulePath('/request?a=1&b=2')).toBe('/_expo/loaders/request?a=1&b=2');
  });

  it('preserves query parameters with trailing slash', () => {
    expect(getLoaderModulePath('/about/?foo=bar')).toBe('/_expo/loaders/about?foo=bar');
  });
});

describe(fetchLoader, () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('sends no-cache as a request header when revalidating for HMR', async () => {
    const response = {
      ok: true,
      json: async () => ({ ok: true }),
    } as unknown as Response;
    global.fetch = jest.fn(async () => response);

    await fetchLoader('/about', {
      headers: { 'Cache-Control': 'no-cache' },
    });

    expect(global.fetch).toHaveBeenCalledWith('/_expo/loaders/about', {
      headers: expect.objectContaining({
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
      }),
    });
  });
});
