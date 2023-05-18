import { buildAsyncRequire } from '../buildAsyncRequire';
import { loadBundleAsync } from '../loadBundle';

export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../loadBundle', () => ({
  loadBundleAsync: jest.fn(async () => {}),
}));

function getMockRequire() {
  const mockRequire: any = jest.fn();
  mockRequire.importAll = jest.fn();

  return mockRequire;
}

const originalEnv = process.env.NODE_ENV;
beforeEach(() => {
  process.env.NODE_ENV = 'development';
});

afterAll(() => {
  process.env.NODE_ENV = originalEnv;
});

it(`builds required object`, async () => {
  const _require = getMockRequire();
  const asyncRequire = buildAsyncRequire(_require);

  expect(asyncRequire).toBeInstanceOf(Function);
  expect(asyncRequire.prefetch).toBeInstanceOf(Function);
  expect(asyncRequire.resource).toBeInstanceOf(Function);
});

it(`loads the module with \`loadBundleAsync\` if the module has not been loaded already`, async () => {
  const _require = getMockRequire();
  const asyncRequire = buildAsyncRequire(_require);

  const myModule = asyncRequire(650, '', { '650': 'SixFiveZero' });
  expect(myModule).toEqual(expect.any(Promise));

  // Did attempt to fetch the bundle
  expect(loadBundleAsync).toBeCalledWith('SixFiveZero');
  expect(_require.importAll).not.toBeCalled();
});

it(`fetches and returns an async module`, async () => {
  const _require = getMockRequire();

  asMock(_require).mockReturnValueOnce({ foo: 'bar' });

  const asyncRequire = buildAsyncRequire(_require);

  expect(asyncRequire).toBeInstanceOf(Function);

  const myModule = await asyncRequire(2, '', {
    '2': 'Two',
  });

  // Fetch and load the bundle into memory.
  expect(loadBundleAsync).toBeCalledWith('Two');

  // Ensure the module was required using Metro after the bundle was loaded.
  expect(_require).toBeCalledWith(2);

  // Ensure the module was returned.
  expect(myModule).toEqual({ foo: 'bar' });
});

it(`disables async requires in production`, async () => {
  process.env.NODE_ENV = 'production';
  const _require = getMockRequire();

  asMock(_require.importAll).mockReturnValueOnce({ foo: 'bar' });

  const asyncRequire = buildAsyncRequire(_require);

  expect(asyncRequire).toBeInstanceOf(Function);

  const myModule = await asyncRequire(2, '', {
    '2': 'Two',
  });

  // Fetch and load the bundle into memory.
  expect(loadBundleAsync).not.toBeCalled();

  // Ensure the module was required using Metro after the bundle was loaded.
  expect(_require.importAll).toBeCalledWith(2);
  expect(_require).not.toBeCalled();

  // Ensure the module was returned.
  expect(myModule).toEqual({ foo: 'bar' });
});
