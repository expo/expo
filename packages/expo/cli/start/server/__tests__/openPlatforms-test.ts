import { AbortCommandError } from '../../../utils/errors';
import { DevServerManager } from '../DevServerManager';
import { openPlatformsAsync } from '../openPlatforms';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

function createDevServerManager() {
  return {
    getDefaultDevServer: jest.fn(() => ({
      openPlatformAsync: jest.fn(),
    })),
    getWebDevServer: jest.fn(() => ({
      openPlatformAsync: jest.fn(),
    })),
    ensureWebDevServerRunningAsync: jest.fn(() => Promise.resolve()),
  } as unknown as DevServerManager;
}

it(`opens all platforms`, async () => {
  const options = {
    android: true,
    ios: true,
    web: true,
  };

  const manager = createDevServerManager();
  const openedNative = await openPlatformsAsync(manager, options);
  expect(openedNative).toBe(true);

  expect(manager.getDefaultDevServer).toHaveBeenCalledTimes(2);
  expect(manager.getWebDevServer).toHaveBeenCalledTimes(1);
  expect(manager.ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(1);
});

it(`opens web only`, async () => {
  const options = {
    android: false,
    ios: false,
    web: true,
  };
  const manager = createDevServerManager();

  const openedNative = await openPlatformsAsync(manager, options);
  expect(openedNative).toBe(false);

  expect(manager.getDefaultDevServer).toHaveBeenCalledTimes(0);
  expect(manager.getWebDevServer).toHaveBeenCalledTimes(1);
  expect(manager.ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(1);
});

it(`rethrows assertions`, async () => {
  const manager = createDevServerManager();
  asMock(manager.getDefaultDevServer).mockImplementationOnce(
    () =>
      ({
        openPlatformAsync() {
          throw new Error('Failed');
        },
      } as any)
  );
  const options = {
    android: true,
    ios: true,
    web: true,
  };
  await expect(openPlatformsAsync(manager, options)).rejects.toThrow(/Failed/);

  expect(manager.getDefaultDevServer).toHaveBeenCalledTimes(1);
  expect(manager.getWebDevServer).toHaveBeenCalledTimes(0);
  expect(manager.ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(0);
});

it(`surfaces aborting`, async () => {
  const manager = createDevServerManager();
  asMock(manager.getDefaultDevServer)
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
  const options = {
    android: true,
    ios: true,
    web: true,
  };
  await expect(openPlatformsAsync(manager, options)).rejects.toThrow(AbortCommandError);

  expect(manager.getDefaultDevServer).toHaveBeenCalledTimes(2);
  expect(manager.getWebDevServer).toHaveBeenCalledTimes(0);
  expect(manager.ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(0);
});
