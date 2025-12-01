import { BuildCacheProviderPlugin } from '@expo/config';
import assert from 'assert';
import { vol } from 'memfs';
import * as path from 'path';

import LocalBuildCacheProvider from '../index';

jest.mock('fs');

function getUploadBuildCache(plugin: BuildCacheProviderPlugin) {
  if ('uploadBuildCache' in plugin && plugin.uploadBuildCache) {
    return plugin.uploadBuildCache;
  }
  throw new Error('uploadBuildCache implementation missing');
}

const uploadBuildCache = getUploadBuildCache(LocalBuildCacheProvider);

describe('LocalBuildCacheProvider.uploadBuildCache', () => {
  afterEach(() => {
    vol.reset();
  });

  it('copies build directories recursively into the local cache', async () => {
    const projectRoot = '/project';
    const buildDir = path.join(projectRoot, 'dist', 'minimaltester.app');
    const nestedFile = path.join(buildDir, 'Contents', 'Info.plist');

    vol.fromJSON(
      {
        [path.join(projectRoot, 'package.json')]: JSON.stringify({
          dependencies: {},
          devDependencies: {},
        }),
        [nestedFile]: 'plist-data',
      },
      '/'
    );

    const fingerprintHash = 'abc123';
    const destPath = await uploadBuildCache(
      {
        projectRoot,
        platform: 'ios',
        fingerprintHash,
        buildPath: buildDir,
        runOptions: {},
      },
      undefined
    );

    expect(destPath).toBeTruthy();
    assert(destPath);
    expect(vol.existsSync(destPath)).toBe(true);
    expect(vol.statSync(destPath).isDirectory()).toBe(true);
    expect(vol.readFileSync(path.join(destPath, 'Contents', 'Info.plist'), 'utf8')).toBe(
      'plist-data'
    );
  });

  it('uses the provided cacheDir option when copying build artifacts', async () => {
    const projectRoot = '/project';
    const cacheDir = '/custom-cache';
    const buildFile = path.join(projectRoot, 'dist', 'minimaltester.apk');

    vol.fromJSON(
      {
        [path.join(projectRoot, 'package.json')]: JSON.stringify({
          dependencies: {},
          devDependencies: {},
        }),
        [buildFile]: 'apk-bytes',
        [cacheDir]: null, // Create directory
      },
      '/'
    );

    const fingerprintHash = 'def456';
    const destPath = await uploadBuildCache(
      {
        projectRoot,
        platform: 'android',
        fingerprintHash,
        buildPath: buildFile,
        runOptions: {
          variant: 'debug',
        },
      },
      { cacheDir }
    );

    const expectedPath = path.join(cacheDir, 'android-def456-debug.apk');
    expect(destPath).toBe(expectedPath);
    expect(vol.existsSync(expectedPath)).toBe(true);
    expect(vol.readFileSync(expectedPath, 'utf8')).toBe('apk-bytes');
    expect(vol.existsSync(path.join(projectRoot, '.expo', 'build-cache'))).toBe(false);
  });
});
