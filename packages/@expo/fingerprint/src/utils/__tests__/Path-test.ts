import { isIgnoredPath } from '../Path';

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
  });
});
