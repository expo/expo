import {
  buildDirMatchObjects,
  buildPathMatchObjects,
  isIgnoredPath,
  normalizeFilePath,
} from '../Path';

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
