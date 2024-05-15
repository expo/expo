import fs from 'fs/promises';

import { loadConfigAsync } from '../Config';

jest.mock('fs/promises');

describe(loadConfigAsync, () => {
  it('should return null if no config file is found', async () => {
    const config = await loadConfigAsync('/app', true);
    expect(config).toBeNull();
  });

  it('should return the config file if it exists', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock(
        '/app/fingerprint.config.js',
        () => ({
          hashAlgorithm: 'sha256',
        }),
        { virtual: true }
      );
      fs.stat = jest.fn().mockResolvedValueOnce({ isFile: () => true } as any);
      const config = await loadConfigAsync('/app', true);
      expect(config).toEqual({ hashAlgorithm: 'sha256' });
      jest.dontMock('/app/fingerprint.config.js');
    });
  });

  it('should mute console logs when mute=true', async () => {
    await jest.isolateModulesAsync(async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.doMock(
        '/app/fingerprint.config.js',
        () => {
          console.log('test log');
          return { hashAlgorithm: 'sha256' };
        },
        { virtual: true }
      );
      fs.stat = jest.fn().mockResolvedValueOnce({ isFile: () => true } as any);
      const config = await loadConfigAsync('/app', true);
      expect(config).toEqual({ hashAlgorithm: 'sha256' });
      jest.dontMock('/app/fingerprint.config.js');
      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  it('should not mute console logs when mute=false', async () => {
    await jest.isolateModulesAsync(async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.doMock(
        '/app/fingerprint.config.js',
        () => {
          console.log('echo from fingerprint.config.js');
          return { hashAlgorithm: 'sha256' };
        },
        { virtual: true }
      );
      fs.stat = jest.fn().mockResolvedValueOnce({ isFile: () => true } as any);
      const config = await loadConfigAsync('/app');
      expect(config).toEqual({ hashAlgorithm: 'sha256' });
      jest.dontMock('/app/fingerprint.config.js');
      expect(logSpy).toHaveBeenCalled();
    });
  });

  it('should strip unsupported config', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock(
        '/app/fingerprint.config.js',
        () => ({
          debug: true,
          otherKey: 'value1',
          otherNestedKey: {
            foo: 'bar',
          },
        }),
        { virtual: true }
      );
      fs.stat = jest.fn().mockResolvedValueOnce({ isFile: () => true } as any);
      const config = await loadConfigAsync('/app', true);
      expect(config).toEqual({ debug: true });
      jest.dontMock('/app/fingerprint.config.js');
    });
  });
});
