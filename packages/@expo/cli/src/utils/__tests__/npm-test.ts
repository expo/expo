import { sanitizeNpmPackageName } from '../npm';

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
