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
