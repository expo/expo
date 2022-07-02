import spawnAsync from '@expo/spawn-async';
import { spawn } from 'child_process';

import { asMock } from '../../../../__tests__/asMock';
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
    asMock(spawnAsync).mockResolvedValueOnce({
      stdout: ['avd1', 'avd2'].join(jest.requireActual('os').EOL),
    } as any);

    await expect(listAvdsAsync()).resolves.toStrictEqual([
      { isAuthorized: true, isBooted: false, name: 'avd1', type: 'emulator' },
      { isAuthorized: true, isBooted: false, name: 'avd2', type: 'emulator' },
    ]);
  });
  it(`returns an empty list when emulator fails`, async () => {
    asMock(spawnAsync).mockRejectedValueOnce({
      stderr: 'err',
    } as any);

    await expect(listAvdsAsync()).resolves.toStrictEqual([]);
  });
});

describe(startDeviceAsync, () => {
  it(`times out waiting for an emulator to start`, async () => {
    asMock(ADB.getAttachedDevicesAsync).mockResolvedValue([]);

    // @ts-expect-error
    asMock(spawn).mockReturnValueOnce({
      unref: jest.fn(),
      on: jest.fn(),
    });

    await expect(startDeviceAsync({ name: 'foo' }, { timeout: 5 })).rejects.toThrow(
      /It took too long to start the Android emulator/
    );
  });
  it(`starts an emulator`, async () => {
    asMock(ADB.getAttachedDevicesAsync)
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        // @ts-expect-error
        {
          name: 'foo',
        },
      ]);
    asMock(ADB.isBootAnimationCompleteAsync).mockResolvedValueOnce(true);

    // @ts-expect-error
    asMock(spawn).mockReturnValueOnce({
      unref: jest.fn(),
      on: jest.fn(),
    });

    await expect(
      startDeviceAsync({ name: 'foo' }, { timeout: 500, interval: 10 })
    ).resolves.toStrictEqual({
      name: 'foo',
    });
  });
});
