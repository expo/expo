import { BuildCacheProviderPlugin } from '@expo/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import LocalBuildCacheProvider from '../index';

function getUploadBuildCache(plugin: BuildCacheProviderPlugin) {
  if ('uploadBuildCache' in plugin && plugin.uploadBuildCache) {
    return plugin.uploadBuildCache;
  }
  throw new Error('uploadBuildCache implementation missing');
}

const uploadBuildCache = getUploadBuildCache(LocalBuildCacheProvider);

function createTempProjectRoot(prefix: string = 'local-build-cache-provider-') {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.writeFileSync(
    path.join(projectRoot, 'package.json'),
    JSON.stringify({ dependencies: {}, devDependencies: {} }, null, 2)
  );
  return projectRoot;
}

describe('LocalBuildCacheProvider.uploadBuildCache', () => {
  it('copies build directories recursively into the local cache', async () => {
    const projectRoot = createTempProjectRoot();
    const buildDir = path.join(projectRoot, 'dist', 'minimaltester.app');
    const nestedFile = path.join(buildDir, 'Contents', 'Info.plist');

    try {
      fs.mkdirSync(path.dirname(nestedFile), { recursive: true });
      fs.writeFileSync(nestedFile, 'plist-data');

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
      expect(fs.existsSync(destPath!)).toBe(true);
      expect(fs.statSync(destPath!).isDirectory()).toBe(true);
      expect(fs.readFileSync(path.join(destPath!, 'Contents', 'Info.plist'), 'utf8')).toBe(
        'plist-data'
      );
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  it('uses the provided cacheDir option when copying build artifacts', async () => {
    const projectRoot = createTempProjectRoot();
    const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'custom-local-build-cache-'));
    const buildFile = path.join(projectRoot, 'dist', 'minimaltester.apk');

    try {
      fs.mkdirSync(path.dirname(buildFile), { recursive: true });
      fs.writeFileSync(buildFile, 'apk-bytes');

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
      expect(fs.existsSync(expectedPath)).toBe(true);
      expect(fs.readFileSync(expectedPath, 'utf8')).toBe('apk-bytes');
      expect(fs.existsSync(path.join(projectRoot, '.expo', 'build-cache'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }
  });
});
