import { buildAsyncRequire } from '../buildAsyncRequire';
import { loadBundleAsync } from '../loadBundle';

export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../loadBundle', () => ({
  loadBundleAsync: jest.fn(async () => {}),
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
