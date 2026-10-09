import { wrapFetchWithWindowLocation } from '../install.native';

function mockLocation(origin: string | null) {
  if (origin) {
    Object.defineProperty(window, 'location', {
      value: { origin },
      configurable: true,
      writable: true,
    });
  } else {
    Reflect.deleteProperty(window, 'location');
  }
}

describe(wrapFetchWithWindowLocation, () => {
  afterEach(() => mockLocation(null));

  it(`resolves a relative URL against the location origin`, () => {
    mockLocation('http://proxy.test:4443');
    const fetch = jest.fn();
    wrapFetchWithWindowLocation(fetch)('/api/route');
    expect(fetch).toHaveBeenCalledWith('http://proxy.test:4443/api/route');
  });

  it(`resolves the url of a request-like object`, () => {
    mockLocation('http://proxy.test:4443');
    const fetch = jest.fn();
    wrapFetchWithWindowLocation(fetch)({ url: '/api/route' });
    expect(fetch).toHaveBeenCalledWith({ url: 'http://proxy.test:4443/api/route' });
  });

  it(`leaves an absolute URL alone`, () => {
    mockLocation('http://proxy.test:4443');
    const fetch = jest.fn();
    wrapFetchWithWindowLocation(fetch)('https://example.test/api/route');
    expect(fetch).toHaveBeenCalledWith('https://example.test/api/route');
  });

  it(`passes a relative URL through when there is no location to resolve against`, () => {
    // `window.location` is unset when the bundle wasn't served over HTTP and no origin is configured.
    // The request then has to fail on its own terms, rather than throwing "Invalid URL" from here.
    mockLocation(null);
    const fetch = jest.fn();
    expect(() => wrapFetchWithWindowLocation(fetch)('/api/route')).not.toThrow();
    expect(fetch).toHaveBeenCalledWith('/api/route');
  });
});
