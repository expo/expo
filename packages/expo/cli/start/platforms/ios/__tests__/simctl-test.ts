import spawnAsync from '@expo/spawn-async';

import * as Log from '../../../../log';
import { getContainerPathAsync, getDevicesAsync } from '../simctl';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('@expo/spawn-async');
jest.mock(`../../../../log`);

beforeEach(() => {
  asMock(spawnAsync).mockClear();
});

describe(getDevicesAsync, () => {
  it(`returns a list of malformed devices`, async () => {
    asMock(spawnAsync)
      .mockClear()
      .mockResolvedValueOnce({
        stdout: 'foobar',
      } as any);

    await expect(getDevicesAsync()).rejects.toThrowError();
    // Blame for the error.
    expect(Log.error).toBeCalledWith(expect.stringMatching(/Apple's simctl/));
  });

  it(`returns a list of devices`, async () => {
    asMock(spawnAsync)
      .mockClear()
      .mockResolvedValueOnce({
        stdout: JSON.stringify(require('./fixtures/xcrun-simctl-list-devices.json')),
      } as any);

    const devices = await getDevicesAsync();
    expect(devices.length).toBe(12);
    for (const device of devices) {
      expect(device.udid).toEqual(expect.any(String));
      expect(device.windowName).toEqual(expect.any(String));
      expect(device.osType).toEqual(expect.stringMatching(/(iOS|watchOS|tvOS)/));
      expect(device.osVersion).toEqual(expect.any(String));
    }
  });
});

describe(getContainerPathAsync, () => {
  it(`returns container path`, async () => {
    asMock(spawnAsync)
      .mockClear()
      .mockResolvedValueOnce({
        stdout: '  /path/to/my-app.app ',
      } as any);

    await expect(getContainerPathAsync({ udid: undefined }, { appId: 'foobar' })).resolves.toBe(
      '/path/to/my-app.app'
    );

    expect(spawnAsync).toBeCalledWith(
      'xcrun',
      ['simctl', 'get_app_container', 'booted', 'foobar'],
      undefined
    );
  });
  it(`returns null when the requested app isn't installed`, async () => {
    asMock(spawnAsync)
      .mockClear()
      .mockRejectedValueOnce({
        stderr: 'No such file or directory',
      } as any);

    await expect(getContainerPathAsync({ udid: undefined }, { appId: 'foobar' })).resolves.toBe(
      null
    );
  });
});
