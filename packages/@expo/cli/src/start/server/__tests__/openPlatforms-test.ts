import { AbortCommandError } from '../../../utils/errors';
import { DevServerManager } from '../DevServerManager';
import { openPlatformsAsync } from '../openPlatforms';

function createDevServerManager() {
  return {
    getDefaultDevServer: jest.fn(() => ({
      openPlatformAsync: jest.fn(async () => {}),
    })),
    getWebDevServer: jest.fn(() => ({
      openPlatformAsync: jest.fn(async () => {}),
    })),
    ensureWebDevServerRunningAsync: jest.fn(async () => {}),
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
  jest.mocked(manager.getDefaultDevServer).mockImplementationOnce(
    () =>
      ({
        async openPlatformAsync() {
          throw new Error('Failed');
        },
      }) as any
  );
  const options = {
    android: true,
    ios: true,
    web: true,
  };
  await expect(openPlatformsAsync(manager, options)).rejects.toThrow(/Failed/);

  expect(manager.getDefaultDevServer).toHaveBeenCalledTimes(2);
  expect(manager.getWebDevServer).toHaveBeenCalledTimes(1);
  expect(manager.ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(1);
});

it(`surfaces aborting`, async () => {
  const manager = createDevServerManager();
  jest
    .mocked(manager.getDefaultDevServer)
    .mockReturnValueOnce({
      async openPlatformAsync() {},
    } as any)
    .mockImplementationOnce(
      () =>
        ({
          async openPlatformAsync() {
            throw new AbortCommandError();
          },
        }) as any
    );
  const options = {
    android: true,
    ios: true,
    web: true,
  };
  await expect(openPlatformsAsync(manager, options)).rejects.toThrow(AbortCommandError);

  expect(manager.getDefaultDevServer).toHaveBeenCalledTimes(2);
  expect(manager.getWebDevServer).toHaveBeenCalledTimes(1);
  expect(manager.ensureWebDevServerRunningAsync).toHaveBeenCalledTimes(1);
});
