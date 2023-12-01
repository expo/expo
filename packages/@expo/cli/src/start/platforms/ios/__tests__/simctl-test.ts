import spawnAsync from '@expo/spawn-async';

import * as Log from '../../../../log';
import {
  getContainerPathAsync,
  getDevicesAsync,
  getInfoPlistValueAsync,
  isOSType,
} from '../simctl';

jest.mock(`../../../../log`);

describe(isOSType, () => {
  it(`returns true for iOS`, () => {
    expect(isOSType('iOS')).toBe(true);
  });
  it(`returns false for number`, () => {
    expect(isOSType(1)).toBe(false);
  });
  it(`returns true and warns for an unknown string`, () => {
    expect(isOSType('foobar')).toBe(true);
    expect(Log.warn).toHaveBeenCalledWith(expect.stringContaining('foobar'));
  });
});

describe(getDevicesAsync, () => {
  it(`returns a list of malformed devices`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
      stdout: 'foobar',
    } as any);

    await expect(getDevicesAsync()).rejects.toThrowError();
    // Blame for the error.
    expect(Log.error).toBeCalledWith(expect.stringMatching(/Apple's simctl/));
  });

  it(`returns a list of devices`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
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

describe(getInfoPlistValueAsync, () => {
  it(`fetches a value from the Info.plist of an app`, async () => {
    jest
      .mocked(spawnAsync)
      .mockResolvedValueOnce({
        // Like: '/Users/evanbacon/Library/Developer/CoreSimulator/Devices/EFEEA6EF-E3F5-4EDE-9B72-29EAFA7514AE/data/Containers/Bundle/Application/FA43A0C6-C2AD-442D-B8B1-EAF3E88CF3BF/Exponent-2.23.2.tar.app'
        stdout: '  /path/to/my-app.app ',
      } as any)
      .mockReturnValueOnce({ output: ['2.23.2 '] } as any);

    await expect(
      getInfoPlistValueAsync(
        { udid: 'FA43A0C6-C2AD-442D-B8B1-EAF3E88CF3BF' },
        { appId: 'com.my-app', key: 'CFBundleShortVersionString' }
      )
    ).resolves.toEqual('2.23.2');
    expect(spawnAsync).toHaveBeenNthCalledWith(
      2,
      'defaults',
      ['read', '/path/to/my-app.app/Info', 'CFBundleShortVersionString'],
      expect.anything()
    );
  });
});

describe(getContainerPathAsync, () => {
  it(`returns container path`, async () => {
    jest.mocked(spawnAsync).mockResolvedValueOnce({
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
    jest.mocked(spawnAsync).mockRejectedValueOnce({
      stderr: 'No such file or directory',
    } as any);

    await expect(getContainerPathAsync({ udid: undefined }, { appId: 'foobar' })).resolves.toBe(
      null
    );
  });
});
