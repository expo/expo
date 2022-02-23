import { AbortCommandError } from '../../../utils/errors';
import { openPlatformsAsync } from '../openPlatforms';
import {
  ensureWebDevServerRunningAsync,
  getDefaultDevServer,
  getWebDevServer,
} from '../startDevServers';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../startDevServers', () => ({
  getDefaultDevServer: jest.fn(() => ({
    openPlatformAsync: jest.fn(),
  })),
  getWebDevServer: jest.fn(() => ({
    openPlatformAsync: jest.fn(),
  })),
  ensureWebDevServerRunningAsync: jest.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  asMock(getDefaultDevServer).mockClear();
  asMock(getWebDevServer).mockClear();
  asMock(ensureWebDevServerRunningAsync).mockClear();
});

it(`opens all platforms`, async () => {
  const projectRoot = '/';
  const options = {
    android: true,
    ios: true,
    web: true,
  };
  const openedNative = await openPlatformsAsync(projectRoot, options);
  expect(openedNative).toBe(true);

  expect(getDefaultDevServer).toHaveBeenCalledTimes(2);
  expect(getWebDevServer).toHaveBeenCalledTimes(1);
  expect(ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(1);
});

it(`opens web only`, async () => {
  const projectRoot = '/';
  const options = {
    android: false,
    ios: false,
    web: true,
  };
  const openedNative = await openPlatformsAsync(projectRoot, options);
  expect(openedNative).toBe(false);

  expect(getDefaultDevServer).toHaveBeenCalledTimes(0);
  expect(getWebDevServer).toHaveBeenCalledTimes(1);
  expect(ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(1);
});

it(`rethrows assertions`, async () => {
  asMock(getDefaultDevServer).mockImplementationOnce(
    () =>
      ({
        openPlatformAsync() {
          throw new Error('Failed');
        },
      } as any)
  );
  const projectRoot = '/';
  const options = {
    android: true,
    ios: true,
    web: true,
  };
  await expect(openPlatformsAsync(projectRoot, options)).rejects.toThrow(/Failed/);

  expect(getDefaultDevServer).toHaveBeenCalledTimes(1);
  expect(getWebDevServer).toHaveBeenCalledTimes(0);
  expect(ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(0);
});

it(`surfaces aborting`, async () => {
  asMock(getDefaultDevServer)
    .mockReturnValueOnce({
      openPlatformAsync() {},
    } as any)
    .mockImplementationOnce(
      () =>
        ({
          openPlatformAsync() {
            throw new AbortCommandError();
          },
        } as any)
    );
  const projectRoot = '/';
  const options = {
    android: true,
    ios: true,
    web: true,
  };
  await expect(openPlatformsAsync(projectRoot, options)).rejects.toThrow(AbortCommandError);

  expect(getDefaultDevServer).toHaveBeenCalledTimes(2);
  expect(getWebDevServer).toHaveBeenCalledTimes(0);
  expect(ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(0);
});
