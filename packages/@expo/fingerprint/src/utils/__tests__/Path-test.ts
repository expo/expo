import { vol } from 'memfs';
import process from 'node:process';

import {
  buildDirMatchObjects,
  buildPathMatchObjects,
  getNodeModulesPackageJsonPath,
  isIgnoredPath,
  normalizeFilePath,
  normalizeVirtualStorePath,
  pathExistsAsync,
  toPosixPath,
} from '../Path';

describe(getNodeModulesPackageJsonPath, () => {
  it('should resolve the package.json for a file inside a node_modules package', () => {
    expect(getNodeModulesPackageJsonPath('node_modules/expo-camera/android/src/Camera.kt')).toBe(
      'node_modules/expo-camera/package.json'
    );
  });

  it('should resolve the package.json for a scoped package', () => {
    expect(getNodeModulesPackageJsonPath('node_modules/@expo/ui/ios')).toBe(
      'node_modules/@expo/ui/package.json'
    );
  });

  it('should use the innermost node_modules for a nested dependency', () => {
    expect(getNodeModulesPackageJsonPath('node_modules/a/node_modules/b/lib/index.js')).toBe(
      'node_modules/a/node_modules/b/package.json'
    );
  });

  it('should return null when the path is not inside node_modules', () => {
    expect(getNodeModulesPackageJsonPath('modules/my-local-module/android')).toBeNull();
  });
});

jest.mock('fs/promises');
jest.mock('node:process', () => ({
  platform: jest.requireActual('node:process').platform,
}));

describe(isIgnoredPath, () => {
  it('should support file pattern', () => {
    expect(isIgnoredPath('app.json', ['app.json'])).toBe(true);
    expect(isIgnoredPath('app.ts', ['*.{js,ts}'])).toBe(true);
    expect(isIgnoredPath('/dir/app.json', ['/dir/*.json'])).toBe(true);
  });

  it('should support directory pattern', () => {
    expect(isIgnoredPath('/app/ios/Podfile', ['**/ios/**/*'])).toBe(true);
  });

  it('case sensitive by design', () => {
    expect(isIgnoredPath('app.json', ['APP.JSON'])).toBe(false);
  });

  it('should include dot files from wildcard pattern', () => {
    expect(isIgnoredPath('.bashrc', ['*'])).toBe(true);
  });

  it('no `matchBase` and `partial` by design', () => {
    expect(isIgnoredPath('/dir/app.json', ['app.json'])).toBe(false);
  });

  it('match a file inside a dir should use a globstar', () => {
    expect(isIgnoredPath('/dir/app.ts', ['*'])).toBe(false);
    expect(isIgnoredPath('/dir/app.ts', ['**/*'])).toBe(true);
  });

  it('should use `!` to override default ignorePaths', () => {
    const ignorePaths = ['**/ios/**/*', '!**/ios/Podfile', '**/android/**/*'];
    expect(isIgnoredPath('/app/ios/Podfile', ignorePaths)).toBe(false);
    expect(isIgnoredPath('/app/ios/Podfile.lock', ignorePaths)).toBe(true);
  });

  it('should support matching only current folder', () => {
    const ignorePaths = ['ios/**/*', '!ios/Podfile', '!ios/Podfile.lock'];
    expect(isIgnoredPath('ios/HelloWorld/AppDelegate.mm', ignorePaths)).toBe(true);
    expect(isIgnoredPath('ios/Podfile', ignorePaths)).toBe(false);
    expect(isIgnoredPath('ios/Podfile.lock', ignorePaths)).toBe(false);
    expect(isIgnoredPath('android/src/main/java/com/test/Test.kt', ignorePaths)).toBe(false);
    expect(isIgnoredPath('node_modules/module/ios/Test.m', ignorePaths)).toBe(false);
    expect(
      isIgnoredPath('node_modules/module/android/src/main/java/com/test/Test.kt', ignorePaths)
    ).toBe(false);
  });

  it('should match node_modules from parent directories', () => {
    const ignorePaths = ['**/node_modules/chalk/**/*'];
    expect(isIgnoredPath('node_modules/chalk/package.json', ignorePaths)).toBe(true);
    expect(isIgnoredPath('../node_modules/chalk/package.json', ignorePaths)).toBe(true);
    expect(isIgnoredPath('../../node_modules/chalk/package.json', ignorePaths)).toBe(true);
    expect(isIgnoredPath('../../../node_modules/chalk/package.json', ignorePaths)).toBe(true);
    expect(
      isIgnoredPath(
        '../../packages/@expo/config-plugins/node_modules/chalk/package.json',
        ignorePaths
      )
    ).toBe(true);
  });

  it('should match .cxx from parent directories', () => {
    const ignorePaths = ['**/android/.cxx/**/*'];
    expect(isIgnoredPath('node_modules/module/android/.cxx/file', ignorePaths)).toBe(true);
    expect(isIgnoredPath('../node_modules/module/android/.cxx/file', ignorePaths)).toBe(true);
    expect(isIgnoredPath('../../node_modules/module/android/.cxx/file', ignorePaths)).toBe(true);
    expect(isIgnoredPath('../../modules/local-module/android/.cxx/file', ignorePaths)).toBe(true);
    expect(isIgnoredPath('../../packages/local-module/android/.cxx/file', ignorePaths)).toBe(true);
  });
});

describe(buildDirMatchObjects, () => {
  it('should build from patterns with `/**/*`, `/**`, or `/` suffix', () => {
    const ignorePathMatchObjects = buildPathMatchObjects(['**/dir1/**/*', '**/dir2/**', 'dir3/']);
    const dirMatchObjects = buildDirMatchObjects(ignorePathMatchObjects);
    const dirPatterns = dirMatchObjects.map((obj) => obj.pattern);
    expect(dirPatterns).toEqual(['**/dir1', '**/dir2', 'dir3']);
  });

  // `**/file` and `**/dir` can be ambiguous between files and dirs,
  // because we don't check the real type of the path.
  // To avoid this, you should use `**/dir/**/*` or `**/dir/` instead.
  it('should not build from patterns that can be ambiguous between files and dirs', () => {
    const ignorePathMatchObjects = buildPathMatchObjects(['**/dir', '**/file', 'dir2']);
    const dirMatchObjects = buildDirMatchObjects(ignorePathMatchObjects);
    const dirPatterns = dirMatchObjects.map((obj) => obj.pattern);
    expect(dirPatterns).toEqual([]);
  });

  it('should remove existing directory patterns if there is a negate pattern in the same directory', () => {
    const ignorePathMatchObjects = buildPathMatchObjects(['**/ios/**/*', '!**/ios/Podfile']);
    const dirMatchObjects = buildDirMatchObjects(ignorePathMatchObjects);
    const dirPatterns = dirMatchObjects.map((obj) => obj.pattern);
    expect(dirPatterns).toEqual([]);
  });
});

describe(normalizeFilePath, () => {
  it('should normalize the file path for empty options', () => {
    const options = {};
    expect(normalizeFilePath('app.json', options)).toBe('app.json');
    expect(normalizeFilePath('/app.json', options)).toBe('/app.json');
    expect(normalizeFilePath('/dir/app.json', options)).toBe('/dir/app.json');
    expect(normalizeFilePath('dir/app.json', options)).toBe('dir/app.json');
    expect(normalizeFilePath('../dir/app.json', options)).toBe('../dir/app.json');
    expect(normalizeFilePath('../../dir/app.json', options)).toBe('../../dir/app.json');
  });

  it('should normalize the file path for `stripParentPrefix` option', () => {
    const options = { stripParentPrefix: true };
    expect(normalizeFilePath('app.json', options)).toBe('app.json');
    expect(normalizeFilePath('/app.json', options)).toBe('/app.json');
    expect(normalizeFilePath('/dir/app.json', options)).toBe('/dir/app.json');
    expect(normalizeFilePath('dir/app.json', options)).toBe('dir/app.json');
    expect(normalizeFilePath('../dir/app.json', options)).toBe('dir/app.json');
    expect(normalizeFilePath('../../dir/app.json', options)).toBe('dir/app.json');
    expect(normalizeFilePath('../../node_modules/module', options)).toBe('node_modules/module');
    expect(normalizeFilePath('../../packages/module', options)).toBe('packages/module');
  });
});

describe(toPosixPath, () => {
  const platform = process.platform;

  describe('linux', () => {
    // Make the test think we are running on Linux
    beforeAll(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
    });
    afterAll(() => {
      Object.defineProperty(process, 'platform', { value: platform });
    });

    it('should not convert Unix to POSIX path on platforms other than Windows', () => {
      expect(toPosixPath('C:\\path\\to\\file')).toBe('C:\\path\\to\\file');
      expect(toPosixPath('/path/to/file')).toBe('/path/to/file');
    });
  });

  describe('windows', () => {
    // Make the test think we are running on Windows
    beforeAll(() => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
    });
    afterAll(() => {
      Object.defineProperty(process, 'platform', { value: platform });
    });

    it('should convert an Unix path to a POSIX path', () => {
      expect(toPosixPath('/path/to/file')).toBe('/path/to/file');
    });

    it('should convert a Windows path to a POSIX path', () => {
      expect(toPosixPath('C:\\path\\to\\file')).toBe('C:/path/to/file');
    });

    it('should convert a WSL path to a POSIX path', () => {
      expect(toPosixPath('/mnt/c/path/to/file')).toBe('/mnt/c/path/to/file');
    });

    it('should handle converted paths', () => {
      expect(toPosixPath('C:/path/to/file')).toBe('C:/path/to/file');
    });
  });
});

describe(pathExistsAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it('should return true if the file exists', async () => {
    vol.fromJSON({
      '/app.json': '',
    });
    expect(await pathExistsAsync('/app.json')).toBe(true);
  });

  it('should return true if the directory exists', async () => {
    vol.fromJSON({
      '/dir/file.txt': '',
    });
    expect(await pathExistsAsync('/dir')).toBe(true);
  });

  it('should return false if the file does not exist', async () => {
    expect(await pathExistsAsync('/app.json')).toBe(false);
  });
});

describe(normalizeVirtualStorePath, () => {
  it('should collapse a pnpm virtual store segment down to the package path', () => {
    expect(
      normalizeVirtualStorePath(
        'node_modules/.pnpm/expo-camera@1.0.0_react-native@0.86.0/node_modules/expo-camera/android'
      )
    ).toBe('node_modules/expo-camera/android');
  });

  it('should keep the scope of a scoped package', () => {
    expect(
      normalizeVirtualStorePath(
        'node_modules/.pnpm/@react-native-firebase+app@23.8.2_react-native@0.86.0/node_modules/@react-native-firebase/app/android'
      )
    ).toBe('node_modules/@react-native-firebase/app/android');
  });

  it('should collapse the same shape for other isolated installers', () => {
    expect(
      normalizeVirtualStorePath('node_modules/.bun/expo-camera@1.0.0/node_modules/expo-camera/ios')
    ).toBe('node_modules/expo-camera/ios');
    expect(
      normalizeVirtualStorePath(
        'node_modules/.store/expo-camera-npm-1.0.0-abcdef/node_modules/expo-camera/ios'
      )
    ).toBe('node_modules/expo-camera/ios');
  });

  it('should keep a parent directory prefix', () => {
    expect(
      normalizeVirtualStorePath(
        '../../node_modules/.pnpm/expo-camera@1.0.0_react-native@0.86.0/node_modules/expo-camera/ios'
      )
    ).toBe('../../node_modules/expo-camera/ios');
  });

  it('should collapse every store segment of a nested workspace path', () => {
    expect(
      normalizeVirtualStorePath(
        'packages/app/node_modules/.pnpm/a@1.0.0/node_modules/a/node_modules/.pnpm/b@1.0.0/node_modules/b/ios'
      )
    ).toBe('packages/app/node_modules/a/node_modules/b/ios');
  });

  it('should keep a real nested dependency inside a store package', () => {
    expect(
      normalizeVirtualStorePath(
        'node_modules/.pnpm/expo-camera@1.0.0/node_modules/expo-camera/node_modules/nested/index.js'
      )
    ).toBe('node_modules/expo-camera/node_modules/nested/index.js');
  });

  it('should leave paths that only look like a virtual store alone', () => {
    // No store directory name between `.pnpm` and `node_modules`: pnpm's hoisted dependencies.
    expect(normalizeVirtualStorePath('node_modules/.pnpm/node_modules/debug/index.js')).toBe(
      'node_modules/.pnpm/node_modules/debug/index.js'
    );
    // `.pnpm` as ordinary path text, outside node_modules.
    expect(normalizeVirtualStorePath('docs/.pnpm/expo@1.0.0/node_modules/expo/ios')).toBe(
      'docs/.pnpm/expo@1.0.0/node_modules/expo/ios'
    );
    // An unrelated dot directory.
    expect(normalizeVirtualStorePath('node_modules/.cache/expo@1.0.0/node_modules/expo')).toBe(
      'node_modules/.cache/expo@1.0.0/node_modules/expo'
    );
    // A plain install layout.
    expect(normalizeVirtualStorePath('node_modules/expo-camera/android/build.gradle')).toBe(
      'node_modules/expo-camera/android/build.gradle'
    );
  });
});
