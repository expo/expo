import { bumpDevLoaderRevision, fetchLoader, getLoaderModulePath } from '../utils';

describe(getLoaderModulePath, () => {
  it.each([
    ['/', '/_expo/loaders/index'],
    ['/about', '/_expo/loaders/about'],
    ['/about/', '/_expo/loaders/about'],
    ['/posts/123', '/_expo/loaders/posts/123'],
    ['/(group)/index', '/_expo/loaders/(group)/index'],
    ['/request?foo=bar', '/_expo/loaders/request?foo=bar'],
    ['/?foo=bar', '/_expo/loaders/index?foo=bar'],
    ['/request?a=1&b=2', '/_expo/loaders/request?a=1&b=2'],
    ['/about/?foo=bar', '/_expo/loaders/about?foo=bar'],
  ])('converts %s to %s', (routePath, expected) => {
    expect(getLoaderModulePath(routePath)).toBe(expected);
  });
});

describe(fetchLoader, () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({ ok: true }),
        }) as unknown as Response
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function fetchedUrl(): string {
    return (global.fetch as jest.Mock).mock.calls[0][0];
  }

  function fetchedInit(): RequestInit {
    return (global.fetch as jest.Mock).mock.calls[0][1];
  }

  // These tests run in order: the revision is module state that only ever increments.
  it('fetches the plain loader URL before any dev invalidation', async () => {
    await fetchLoader('/about');

    expect(fetchedUrl()).toBe('/_expo/loaders/about');
  });

  it('forwards request options while enforcing the JSON Accept header', async () => {
    const controller = new AbortController();

    await fetchLoader('/about', {
      signal: controller.signal,
      headers: { Accept: 'text/plain', 'X-Test': 'yes' },
    });

    expect(fetchedInit().signal).toBe(controller.signal);
    const headers = fetchedInit().headers as Headers;
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('X-Test')).toBe('yes');
  });

  it('appends a cache-busting revision to loader URLs after a dev invalidation', async () => {
    bumpDevLoaderRevision();

    await fetchLoader('/about');

    const url = new URL(fetchedUrl(), 'http://localhost');
    expect(url.pathname).toBe('/_expo/loaders/about');
    expect(url.searchParams.get('_expo_loader_v')).toMatch(/^\d+$/);
  });

  it('appends the revision after existing query parameters', async () => {
    await fetchLoader('/request?foo=bar');

    const url = new URL(fetchedUrl(), 'http://localhost');
    expect(url.pathname).toBe('/_expo/loaders/request');
    expect(url.searchParams.get('foo')).toBe('bar');
    expect(url.searchParams.get('_expo_loader_v')).toMatch(/^\d+$/);
  });

  it('changes the revision on each subsequent invalidation', async () => {
    await fetchLoader('/about');
    const firstUrl = fetchedUrl();

    bumpDevLoaderRevision();
    (global.fetch as jest.Mock).mockClear();
    await fetchLoader('/about');

    expect(fetchedUrl()).not.toBe(firstUrl);
  });
});
