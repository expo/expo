import * as Log from '../../../../log';
import { getAttachedDevicesAsync, getServer } from '../adb';
import { startAdbReverseAsync, stopAdbReverseAsync } from '../adbReverse';

jest.mock('../../../../log');
jest.mock('../adb', () => {
  const actual = jest.requireActual('../adb');
  const server = {
    runAsync: jest.fn(async () => ''),
  };
  return {
    ...actual,
    getAttachedDevicesAsync: jest.fn(),
    getServer: jest.fn(() => server),
  };
});
jest.mock('../../../../utils/exit', () => ({
  installExitHooks: jest.fn(),
}));

describe(startAdbReverseAsync, () => {
  it(`reverses devices`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([
      {
        isAuthorized: true,
        isBooted: true,
        name: 'Pixel_2',
        pid: 'FA8251A00720',
        type: 'device',
      },
      {
        isAuthorized: true,
        isBooted: true,
        name: 'Pixel_4_XL_API_30',
        pid: 'emulator-5554',
        type: 'emulator',
      },
    ]);
    await expect(startAdbReverseAsync([3000])).resolves.toBe(true);

    expect(getServer().runAsync).toBeCalledTimes(2);
    expect(getServer().runAsync).toHaveBeenNthCalledWith(1, [
      '-s',
      'FA8251A00720',
      'reverse',
      'tcp:3000',
      'tcp:3000',
    ]);
  });
  it(`reverses multiple ports`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([
      {
        isAuthorized: true,
        isBooted: true,
        name: 'Pixel_4_XL_API_30',
        pid: 'emulator-5554',
        type: 'emulator',
      },
    ]);
    await expect(startAdbReverseAsync([3000, 3001])).resolves.toBe(true);

    expect(getServer().runAsync).toBeCalledTimes(2);
    expect(getServer().runAsync).toHaveBeenNthCalledWith(1, [
      '-s',
      'emulator-5554',
      'reverse',
      'tcp:3000',
      'tcp:3000',
    ]);
  });

  it(`returns false when reversing a device that is unauthorized`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([
      {
        isAuthorized: false,
        isBooted: true,
        name: 'Device FA8251A00719',
        pid: 'FA8251A00719',
        type: 'device',
      },
    ]);
    await expect(startAdbReverseAsync([3000])).resolves.toBe(false);
    expect(getServer().runAsync).toBeCalledTimes(0);
    expect(Log.warn).toBeCalledTimes(1);
  });

  it(`returns false when reversing a device fails`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([
      {
        isAuthorized: true,
        isBooted: true,
        name: 'Device FA8251A00719',
        pid: 'FA8251A00719',
        type: 'device',
      },
    ]);
    jest.mocked(getServer().runAsync).mockRejectedValueOnce(new Error('test'));
    await expect(startAdbReverseAsync([3000])).resolves.toBe(false);
    expect(getServer().runAsync).toBeCalledTimes(1);
    expect(Log.warn).toBeCalledTimes(1);
  });
});

describe(stopAdbReverseAsync, () => {
  it(`stops reverse`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([
      {
        isAuthorized: true,
        isBooted: true,
        name: 'Pixel_2',
        pid: 'FA8251A00720',
        type: 'device',
      },
      {
        isAuthorized: true,
        isBooted: true,
        name: 'Pixel_4_XL_API_30',

        pid: 'emulator-5554',
        type: 'emulator',
      },
    ]);
    await stopAdbReverseAsync([3000]);
    expect(getServer().runAsync).toBeCalledTimes(2);
    expect(getServer().runAsync).toHaveBeenNthCalledWith(1, [
      '-s',
      'FA8251A00720',
      'reverse',
      '--remove',
      'tcp:3000',
    ]);
  });
});
