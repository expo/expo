import { buildAsyncRequire } from '../buildAsyncRequire';
import { loadBundleAsync } from '../loadBundle';

export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../loadBundle', () => ({
  loadBundleAsync: jest.fn(async () => {}),
}));
jest.mock('../buildUrlForBundle', () => ({
  buildUrlForBundle: (path: string) => new URL(path, 'https://example.com/nested/page').href,
}));

const originalEnv = process.env.NODE_ENV;
beforeEach(() => {
  process.env.NODE_ENV = 'development';
  asMock(loadBundleAsync).mockReset().mockResolvedValue();
});

afterAll(() => {
  process.env.NODE_ENV = originalEnv;
});

it(`builds required object`, async () => {
  const asyncRequire = buildAsyncRequire();
  expect(asyncRequire).toBeInstanceOf(Function);
});

it(`loads the module with \`loadBundleAsync\` if the module has not been loaded already`, async () => {
  const asyncRequire = buildAsyncRequire();

  const myModule = asyncRequire('/bacon.bundle?platform=ios');
  expect(myModule).toEqual(expect.any(Promise));

  // Did attempt to fetch the bundle
  expect(loadBundleAsync).toHaveBeenCalledWith('/bacon.bundle?platform=ios');
});

it('loads arrays per file and waits for every file, regardless of completion order', async () => {
  let resolveSharedLoad!: () => void;
  let resolveRouteLoad!: () => void;
  asMock(loadBundleAsync)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSharedLoad = resolve;
        })
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRouteLoad = resolve;
        })
    );
  const onLoaded = jest.fn();
  const result = buildAsyncRequire()(['/shared.js', '/route.js']).then(onLoaded);
  expect(asMock(loadBundleAsync).mock.calls).toEqual([['/shared.js'], ['/route.js']]);
  resolveRouteLoad();
  await Promise.resolve();
  expect(onLoaded).not.toHaveBeenCalled();
  resolveSharedLoad();
  await result;
  expect(onLoaded).toHaveBeenCalledTimes(1);
});

it('deduplicates pending and fulfilled files across overlapping arrays and scalar requests', async () => {
  let resolveSharedLoad!: () => void;
  asMock(loadBundleAsync).mockImplementation((path) =>
    path === '/shared.js'
      ? new Promise((resolve) => {
          resolveSharedLoad = resolve;
        })
      : Promise.resolve()
  );
  const asyncRequire = buildAsyncRequire();
  const first = asyncRequire(['/shared.js', '/a.js', '/shared.js']);
  const second = asyncRequire(['/shared.js', '/b.js']);
  const scalar = asyncRequire('/shared.js');
  expect(asMock(loadBundleAsync).mock.calls).toEqual([['/shared.js'], ['/a.js'], ['/b.js']]);
  resolveSharedLoad();
  await Promise.all([first, second, scalar]);
  await asyncRequire(['/a.js', '/shared.js', '/b.js']);
  expect(loadBundleAsync).toHaveBeenCalledTimes(3);
});

it('retries only a failed file, keeping successful array members cached', async () => {
  const failure = new Error('network error');
  asMock(loadBundleAsync)
    .mockResolvedValueOnce()
    .mockRejectedValueOnce(failure)
    .mockResolvedValueOnce();
  const asyncRequire = buildAsyncRequire();
  await expect(asyncRequire(['/shared.js', '/route.js'])).rejects.toBe(failure);
  await expect(asyncRequire(['/shared.js', '/route.js'])).resolves.toBeUndefined();
  expect(asMock(loadBundleAsync).mock.calls).toEqual([
    ['/shared.js'],
    ['/route.js'],
    ['/route.js'],
  ]);
});

it('shares a rejection between concurrent callers and evicts it for a scalar retry', async () => {
  const failure = new Error('load failed');
  asMock(loadBundleAsync).mockRejectedValueOnce(failure).mockResolvedValueOnce();
  const asyncRequire = buildAsyncRequire();
  const first = asyncRequire(['/shared.js']);
  const second = asyncRequire('/shared.js');
  await expect(first).rejects.toBe(failure);
  await expect(second).rejects.toBe(failure);
  await expect(asyncRequire('/shared.js')).resolves.toBeUndefined();
  expect(asMock(loadBundleAsync).mock.calls).toEqual([['/shared.js'], ['/shared.js']]);
});

it('accepts an empty array without making a request', async () => {
  await expect(buildAsyncRequire()([])).resolves.toBeUndefined();
  expect(loadBundleAsync).not.toHaveBeenCalled();
});

it('does not share a cache between loader installations', async () => {
  await buildAsyncRequire()('/route.js');
  await buildAsyncRequire()('/route.js');
  expect(asMock(loadBundleAsync).mock.calls).toEqual([['/route.js'], ['/route.js']]);
});

(process.env.EXPO_OS === 'web' ? describe : describe.skip)('web chunk readiness', () => {
  const originalPlatform = process.env.EXPO_OS;
  beforeEach(() => {
    process.env.EXPO_OS = 'web';
    process.env.NODE_ENV = 'production';
    delete (globalThis as any).__expo_chunk_completion__;
    asMock(loadBundleAsync).mockImplementation(async (path) => {
      const runtime = globalThis as any;
      const key = `${runtime.__METRO_GLOBAL_PREFIX__ ?? ''}__expo_chunk_completion__`;
      // Simulate the chunk footer.
      runtime[key].add(new URL(path, 'https://example.com/nested/page').href);
    });
  });
  afterEach(() => {
    process.env.EXPO_OS = originalPlatform;
    delete (globalThis as any).__expo_chunk_completion__;
  });

  it('preserves early footer records and observes later ones without refetching', async () => {
    const completedUrls = new Set(['https://example.com/shared.js']);
    (globalThis as any).__expo_chunk_completion__ = completedUrls;
    const asyncRequire = buildAsyncRequire();
    expect(asyncRequire.isReady?.(['/shared.js', '/route.js'])).toBe(false);
    completedUrls.add('https://example.com/route.js');
    expect(asyncRequire.isReady?.(['/shared.js', '/route.js'])).toBe(true);
    await asyncRequire(['/shared.js', '/route.js']);
    expect(loadBundleAsync).not.toHaveBeenCalled();
  });

  it('does not call a pending or rejected file ready, and retries it', async () => {
    let reject!: (error: Error) => void;
    asMock(loadBundleAsync).mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        })
    );
    const asyncRequire = buildAsyncRequire();
    const pendingLoad = asyncRequire(['/route.js']);
    expect(asyncRequire.isReady?.(['/route.js'])).toBe(false);
    reject(new Error('failed'));
    await expect(pendingLoad).rejects.toThrow('failed');
    expect(asyncRequire.isReady?.(['/route.js'])).toBe(false);
    await asyncRequire(['/route.js']);
    expect(asyncRequire.isReady?.(['/route.js'])).toBe(true);
  });

  it('uses the loader URL, not a differing document base, and retains query strings', async () => {
    (globalThis as any).__expo_chunk_completion__ = new Set(['https://example.com/base/route.js']);
    const asyncRequire = buildAsyncRequire();
    expect(asyncRequire.isReady?.(['route.js'])).toBe(false);
    await asyncRequire(['route.js']);
    expect(loadBundleAsync).toHaveBeenCalledWith('route.js');
    expect(asyncRequire.isReady?.(['https://example.com/nested/route.js'])).toBe(true);
    expect(asyncRequire.isReady?.(['route.js?v=2'])).toBe(false);
  });

  it('rejects incomplete registration and retries only the file without a footer', async () => {
    asMock(loadBundleAsync).mockResolvedValueOnce();
    const asyncRequire = buildAsyncRequire();
    const importAll = jest.fn();
    await expect(asyncRequire(['/shared.js', '/route.js']).then(importAll)).rejects.toThrow(
      /shared\.js.*did not finish registering/
    );
    expect(importAll).not.toHaveBeenCalled();
    expect(asyncRequire.isReady?.(['/shared.js'])).toBe(false);
    expect(asyncRequire.isReady?.(['/route.js'])).toBe(true);

    await asyncRequire(['/shared.js', '/route.js']).then(importAll);
    expect(importAll).toHaveBeenCalledTimes(1);
    expect(asMock(loadBundleAsync).mock.calls).toEqual([
      ['/shared.js'],
      ['/route.js'],
      ['/shared.js'],
    ]);
  });

  it('does not promote a fulfilled scalar load into array readiness', async () => {
    asMock(loadBundleAsync).mockResolvedValueOnce();
    const asyncRequire = buildAsyncRequire();
    await asyncRequire('/route.js');
    expect(asyncRequire.isReady?.(['/route.js'])).toBe(false);
    await expect(asyncRequire(['/route.js'])).rejects.toThrow(/did not finish registering/);
    await asyncRequire(['/route.js']);
    expect(asyncRequire.isReady?.(['/route.js'])).toBe(true);
    expect(loadBundleAsync).toHaveBeenCalledTimes(2);
  });

  it('rejects concurrent incomplete loads and caches a successful retry', async () => {
    asMock(loadBundleAsync).mockResolvedValueOnce();
    const asyncRequire = buildAsyncRequire();
    const first = asyncRequire(['/route.js']).catch(() => asyncRequire(['/route.js']));
    const second = asyncRequire(['/route.js']);
    await expect(second).rejects.toThrow(/did not finish registering/);
    await first;
    await asyncRequire(['/route.js']);
    expect(asyncRequire.isReady?.(['/route.js'])).toBe(true);
    expect(loadBundleAsync).toHaveBeenCalledTimes(2);
  });

  it('isolates Metro prefixes', async () => {
    const runtime = globalThis as any;
    const originalPrefix = runtime.__METRO_GLOBAL_PREFIX__;
    try {
      runtime.__METRO_GLOBAL_PREFIX__ = 'other';
      const prefixedAsyncRequire = buildAsyncRequire();
      await prefixedAsyncRequire(['/shared.js']);
      expect(prefixedAsyncRequire.isReady?.(['/shared.js'])).toBe(true);
      runtime.__METRO_GLOBAL_PREFIX__ = '';
      expect(buildAsyncRequire().isReady?.(['/shared.js'])).toBe(false);
    } finally {
      runtime.__METRO_GLOBAL_PREFIX__ = originalPrefix;
      delete runtime.other__expo_chunk_completion__;
    }
  });
});
