import spawnAsync from '@expo/spawn-async';
import { spawn } from 'child_process';

import * as ADB from '../adb';
import { listAvdsAsync, startDeviceAsync } from '../emulator';

jest.mock('../../../../log');
jest.mock('../adb', () => ({
  getAttachedDevicesAsync: jest.fn(),
  isBootAnimationCompleteAsync: jest.fn(),

  listDevicesAsync: jest.fn(async () => []),
  startDeviceAsync: jest.fn(async () => {}),
}));

describe(listAvdsAsync, () => {
  it(`returns list of avds`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: ['avd1', 'avd2'].join(jest.requireActual('os').EOL),
    } as any);

    await expect(listAvdsAsync()).resolves.toStrictEqual([
      {
        isAuthorized: true,
        isBooted: false,
        isLaunchable: true,
        name: 'avd1',
        type: 'emulator',
      },
      {
        isAuthorized: true,
        isBooted: false,
        isLaunchable: true,
        name: 'avd2',
        type: 'emulator',
      },
    ]);
  });
  it(`preserves emulator tool failures`, async () => {
    jest
      .mocked(spawnAsync)
      .mockRejectedValueOnce(Object.assign(new Error('emulator failed'), { stderr: 'err' }));

    await expect(listAvdsAsync()).rejects.toMatchObject({
      message: 'emulator failed',
      stderr: 'err',
    });
  });
});

describe(startDeviceAsync, () => {
  it(`times out waiting for an emulator to start`, async () => {
    jest.mocked(ADB.getAttachedDevicesAsync).mockResolvedValue([]);

    // @ts-expect-error
    jest.mocked(spawn).mockReturnValueOnce({
      unref: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    });

    await expect(startDeviceAsync({ name: 'foo' }, { timeout: 5 })).rejects.toThrow(
      /It took too long to start the Android emulator/
    );
  });
  it(`starts an emulator`, async () => {
    jest
      .mocked(ADB.getAttachedDevicesAsync)
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        // @ts-expect-error
        {
          name: 'foo',
        },
      ]);
    jest.mocked(ADB.isBootAnimationCompleteAsync).mockResolvedValueOnce(true);

    // @ts-expect-error
    jest.mocked(spawn).mockReturnValueOnce({
      unref: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    });

    await expect(
      startDeviceAsync({ name: 'foo' }, { timeout: 500, interval: 10 })
    ).resolves.toStrictEqual({
      name: 'foo',
    });
  });

  it('retries a transient boot property failure', async () => {
    jest.mocked(ADB.getAttachedDevicesAsync).mockResolvedValue([
      // @ts-expect-error
      { name: 'foo', pid: 'emulator-5554' },
    ]);
    jest
      .mocked(ADB.isBootAnimationCompleteAsync)
      .mockRejectedValueOnce(new Error('property query timed out'))
      .mockResolvedValueOnce(true);
    // @ts-expect-error
    jest.mocked(spawn).mockReturnValueOnce({ unref: jest.fn(), on: jest.fn(), off: jest.fn() });

    await expect(
      startDeviceAsync({ name: 'foo' }, { timeout: 500, interval: 1 })
    ).resolves.toMatchObject({ name: 'foo' });
    expect(ADB.isBootAnimationCompleteAsync).toHaveBeenCalledTimes(2);
  });

  it('keeps boot checks single-flight while an earlier attempt is pending', async () => {
    let resolveFirstCheck!: (devices: ADB.Device[]) => void;
    jest
      .mocked(ADB.getAttachedDevicesAsync)
      .mockImplementationOnce(
        () => new Promise<ADB.Device[]>((resolve) => (resolveFirstCheck = resolve))
      )
      .mockResolvedValue([]);
    // @ts-expect-error
    jest.mocked(spawn).mockReturnValueOnce({
      unref: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    });

    const result = startDeviceAsync({ name: 'foo' }, { timeout: 50, interval: 5 });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(ADB.getAttachedDevicesAsync).toHaveBeenCalledTimes(1);
    expect(ADB.getAttachedDevicesAsync).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
      shouldShowWaitingMessage: false,
    });

    resolveFirstCheck([]);
    await expect(result).rejects.toThrow(/It took too long/);
  });

  it('stops immediately on an underlying discovery failure', async () => {
    const failure = new Error('ADB discovery failed');
    jest.mocked(ADB.getAttachedDevicesAsync).mockRejectedValueOnce(failure);
    // @ts-expect-error
    jest.mocked(spawn).mockReturnValueOnce({ unref: jest.fn(), on: jest.fn(), off: jest.fn() });

    await expect(startDeviceAsync({ name: 'foo' })).rejects.toBe(failure);
  });

  it('threads explicit caller cancellation through a pending discovery check', async () => {
    jest
      .mocked(ADB.getAttachedDevicesAsync)
      .mockImplementationOnce(
        ({ signal } = {}) =>
          new Promise((_, reject) =>
            signal!.addEventListener('abort', () => reject(signal!.reason), { once: true })
          )
      );
    // @ts-expect-error
    jest.mocked(spawn).mockReturnValueOnce({ unref: jest.fn(), on: jest.fn(), off: jest.fn() });
    const controller = new AbortController();
    const reason = new Error('caller cancelled');
    const result = startDeviceAsync({ name: 'foo' }, { signal: controller.signal });

    controller.abort(reason);
    await expect(result).rejects.toBe(reason);
  });

  it('reports emulator process exit instead of a boot timeout and disposes listeners', async () => {
    const handlers = new Map<string, () => void>();
    const child = {
      unref: jest.fn(),
      on: jest.fn((event: string, handler: () => void) => handlers.set(event, handler)),
      off: jest.fn(),
    };
    jest
      .mocked(ADB.getAttachedDevicesAsync)
      .mockImplementationOnce(
        ({ signal } = {}) =>
          new Promise((_, reject) =>
            signal!.addEventListener('abort', () => reject(signal!.reason), { once: true })
          )
      );
    // @ts-expect-error
    jest.mocked(spawn).mockReturnValueOnce(child);
    const result = startDeviceAsync({ name: 'foo' });

    handlers.get('exit')!();
    await expect(result).rejects.toThrow('quit before it finished opening');
    expect(child.off).toHaveBeenCalledWith('error', handlers.get('error'));
    expect(child.off).toHaveBeenCalledWith('exit', handlers.get('exit'));
  });
});
