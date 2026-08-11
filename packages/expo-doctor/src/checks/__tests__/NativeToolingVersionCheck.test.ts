import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { getXcodeVersionAsync } from '../../utils/getXcodeVersionAsync';
import { NativeToolingVersionCheck } from '../NativeToolingVersionCheck';
jest.mock('fs');
jest.mock('../../utils/getXcodeVersionAsync', () => ({
  getXcodeVersionAsync: jest.fn().mockResolvedValue({ xcodeVersion: '15.0' }),
}));

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  pkg: { name: 'name', version: '1.0.0' },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

describe('runAsync', () => {
  const platform = process.platform;

  const mockPlatform = (value: string) =>
    Object.defineProperty(process, 'platform', {
      value,
    });

  afterEach(() => {
    vol.reset();
    mockPlatform(platform);
  });

  describe('on macOS', () => {
    beforeEach(() => {
      mockPlatform('darwin');
    });

    it('returns result with isSuccessful = true if ios folder present, Cocoapods >= 1.15.2', async () => {
      jest.mocked(spawnAsync).mockImplementationOnce(() =>
        mockSpawnPromise(
          Promise.resolve({
            status: 0,
            stdout: '1.15.2',
          })
        )
      );

      vol.fromJSON({
        [projectRoot + '/ios/Podfile']: 'test',
      });
      const check = new NativeToolingVersionCheck();
      const result = await check.runAsync(additionalProjectProps);
      expect(result.isSuccessful).toBeTruthy();
    });

    it('returns result with isSuccessful = false if ios folder present, Cocoapods = 1.15.1', async () => {
      jest.mocked(spawnAsync).mockImplementationOnce(() =>
        mockSpawnPromise(
          Promise.resolve({
            status: 0,
            stdout: '1.15.1',
          })
        )
      );

      vol.fromJSON({
        [projectRoot + '/ios/Podfile']: 'test',
      });
      const check = new NativeToolingVersionCheck();
      const result = await check.runAsync(additionalProjectProps);
      expect(result.isSuccessful).toBeFalsy();
    });

    it('returns result with isSuccessful = false if ios folder present, Cocoapods version returns nonsense', async () => {
      jest.mocked(spawnAsync).mockImplementationOnce(() =>
        mockSpawnPromise(
          Promise.resolve({
            status: 0,
            stdout: 'slartibartfast',
          })
        )
      );

      vol.fromJSON({
        [projectRoot + '/ios/Podfile']: 'test',
      });
      const check = new NativeToolingVersionCheck();
      const result = await check.runAsync(additionalProjectProps);
      expect(result.isSuccessful).toBeFalsy();
    });

    it('returns result with isSuccessful = false if ios folder present, Cocoapods version check fails', async () => {
      jest.mocked(spawnAsync).mockImplementationOnce(() => {
        const error: any = new Error();
        error.status = -1;
        return mockSpawnPromise(Promise.reject(error));
      });

      vol.fromJSON({
        [projectRoot + '/ios/Podfile']: 'test',
      });
      const check = new NativeToolingVersionCheck();
      const result = await check.runAsync(additionalProjectProps);
      expect(result.isSuccessful).toBeFalsy();
    });

    it('returns result with isSuccessful = true if no ios folder present, even if Cocoapods = 1.15.1', async () => {
      jest.mocked(spawnAsync).mockImplementationOnce(() =>
        mockSpawnPromise(
          Promise.resolve({
            status: 0,
            stdout: '1.15.1',
          })
        )
      );

      const check = new NativeToolingVersionCheck();
      const result = await check.runAsync(additionalProjectProps);
      expect(result.isSuccessful).toBeTruthy();
    });
  });

  test('on non-macOS, skips Cocoapods check and returns true', () => {
    mockPlatform('win32');

    const check = new NativeToolingVersionCheck();
    const result = check.runAsync(additionalProjectProps);
    expect(result).resolves.toMatchObject({ isSuccessful: true });
  });

  test('returns error if SDK 51 uses Xcode > 16.2', async () => {
    jest.mocked(getXcodeVersionAsync).mockResolvedValueOnce({ xcodeVersion: '16.3.0' });

    const check = new NativeToolingVersionCheck();
    const result = await check.runAsync({
      ...additionalProjectProps,
      exp: {
        ...additionalProjectProps.exp,
        sdkVersion: '51.0.0',
      },
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  test('returns success if SDK 52 uses Xcode 16.3', async () => {
    jest.mocked(getXcodeVersionAsync).mockResolvedValueOnce({ xcodeVersion: '16.3.0' });

    const check = new NativeToolingVersionCheck();
    const result = await check.runAsync({
      ...additionalProjectProps,
      exp: {
        ...additionalProjectProps.exp,
        sdkVersion: '52.0.0',
      },
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  test('returns success if SDK 51 uses Xcode 16.2', async () => {
    jest.mocked(getXcodeVersionAsync).mockResolvedValueOnce({ xcodeVersion: '16.2.0' });

    const check = new NativeToolingVersionCheck();
    const result = await check.runAsync({
      ...additionalProjectProps,
      exp: {
        ...additionalProjectProps.exp,
        sdkVersion: '51.0.0',
      },
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  test('returns success if xcode is not installed', async () => {
    jest.mocked(getXcodeVersionAsync).mockResolvedValueOnce({ xcodeVersion: null });

    const check = new NativeToolingVersionCheck();
    const result = await check.runAsync(additionalProjectProps);
    expect(result.isSuccessful).toBeTruthy();
  });

  test('returns error if SDK 55 uses Xcode < 26.2', async () => {
    jest.mocked(getXcodeVersionAsync).mockResolvedValueOnce({ xcodeVersion: '26.1.0' });

    const check = new NativeToolingVersionCheck();
    const result = await check.runAsync({
      ...additionalProjectProps,
      exp: {
        ...additionalProjectProps.exp,
        sdkVersion: '55.0.0',
      },
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  test('returns success if SDK 55 uses Xcode 26.2', async () => {
    jest.mocked(getXcodeVersionAsync).mockResolvedValueOnce({ xcodeVersion: '26.2.0' });

    const check = new NativeToolingVersionCheck();
    const result = await check.runAsync({
      ...additionalProjectProps,
      exp: {
        ...additionalProjectProps.exp,
        sdkVersion: '55.0.0',
      },
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  test('returns error for the SDK 57 and Xcode 26.3 environment from issue #48802', async () => {
    jest.mocked(getXcodeVersionAsync).mockResolvedValueOnce({ xcodeVersion: '26.3.0' });

    const check = new NativeToolingVersionCheck();
    const result = await check.runAsync({
      ...additionalProjectProps,
      exp: {
        ...additionalProjectProps.exp,
        sdkVersion: '57.0.12',
      },
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  test('returns success if SDK 57 uses Xcode 26.4', async () => {
    jest.mocked(getXcodeVersionAsync).mockResolvedValueOnce({ xcodeVersion: '26.4.0' });

    const check = new NativeToolingVersionCheck();
    const result = await check.runAsync({
      ...additionalProjectProps,
      exp: {
        ...additionalProjectProps.exp,
        sdkVersion: '57.0.12',
      },
    });
    expect(result.isSuccessful).toBeTruthy();
  });
});
