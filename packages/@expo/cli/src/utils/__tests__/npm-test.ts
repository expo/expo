import { normalizeNpmPackResult, sanitizeNpmPackageName } from '../npm';

describe(normalizeNpmPackResult, () => {
  const packageInfo = { name: 'expo', filename: 'expo.tgz' };

  it('supports the npm 11 and earlier array format', () => {
    expect(normalizeNpmPackResult([packageInfo])).toEqual([packageInfo]);
  });

  it('supports the npm 12 package-keyed object format', () => {
    expect(normalizeNpmPackResult({ expo: packageInfo })).toEqual([packageInfo]);
  });

  it('rejects non-container values', () => {
    expect(normalizeNpmPackResult(null)).toBeNull();
    expect(normalizeNpmPackResult('expo.tgz')).toBeNull();
  });
});

describe(sanitizeNpmPackageName, () => {
  it(`leaves valid names`, () => {
    for (const name of ['@bacon/app', 'my-app', 'my-a.pp']) {
      expect(sanitizeNpmPackageName(name)).toBe(name);
    }
  });
  it(`sanitizes invalid names`, () => {
    for (const [before, after] of [
      ['..__..f_f', 'f_f'],
      ['_f', 'f'],
      ['Hello World', 'helloworld'],
      ['\u2665', 'love'],
      ['あいう', 'app'],
    ]) {
      expect(sanitizeNpmPackageName(before)).toBe(after);
    }
  });
});
