import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { mockSpawnPromise } from '../../__tests__/spawn-utils';
import { NativeToolingVersionCheck } from '../NativeToolingVersionCheck';

jest.mock('fs');

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
});
