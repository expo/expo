import { buildUrlForBundle } from '../buildUrlForBundle';
import getDevServer from '../getDevServer';

export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../getDevServer', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
  // @ts-ignore
  delete window.location;
});

afterAll(() => {
  process.env = originalEnv;
  // @ts-ignore
  delete window.location;
});

it(`returns an expected URL in production`, () => {
  process.env.NODE_ENV = 'production';

  // Mock the location object
  // @ts-expect-error
  window.location = {
    origin: 'http://localhost:19000',
  };

  expect(buildUrlForBundle('/foobar')).toEqual('http://localhost:19000/foobar');
});

it(`asserts in production that the origin was not specified at build-time`, () => {
  process.env.NODE_ENV = 'production';

  // Don't mock the location object...

  expect(() => buildUrlForBundle('/foobar')).toThrow(
    /Unable to determine the production URL where additional JavaScript chunks are hosted because the global "location" variable is not defined\./
  );
});
it(`returns an expected URL in development`, () => {
  process.env.NODE_ENV = 'development';

  asMock(getDevServer).mockReturnValueOnce({
    bundleLoadedFromServer: true,
    fullBundleUrl:
      'http://localhost:19000?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null',
    url: 'http://localhost:19000',
  });

  expect(buildUrlForBundle('/foobar')).toEqual('http://localhost:19000/foobar');
});
