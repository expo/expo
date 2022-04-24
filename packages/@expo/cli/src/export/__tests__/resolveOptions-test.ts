import { resolveOptionsAsync } from '../resolveOptions';

describe(resolveOptionsAsync, () => {
  it(`asserts invalid platform`, async () => {
    await expect(resolveOptionsAsync({ '--platform': 'foobar' })).rejects.toThrow(
      /^The input did not match the regular expression/
    );
  });

  it(`parses qualified options`, async () => {
    await expect(
      resolveOptionsAsync({
        '--output-dir': 'foobar',
        '--platform': 'android',
        '--clear': true,
        '--quiet': true,
        '--dev': true,
        '--dump-assetmap': true,
        '--dump-sourcemap': true,
        '--max-workers': 2,
      })
    ).resolves.toEqual({
      clear: true,
      dev: true,
      dumpAssetmap: true,
      dumpSourcemap: true,
      maxWorkers: 2,
      outputDir: 'foobar',
      platform: 'android',
      quiet: true,
    });
  });

  it(`parses default options`, async () => {
    await expect(resolveOptionsAsync({})).resolves.toEqual({
      clear: false,
      dev: false,
      dumpAssetmap: false,
      dumpSourcemap: false,
      maxWorkers: undefined,
      outputDir: 'dist',
      platform: 'all',
      quiet: false,
    });
  });
});
