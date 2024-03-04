import { getConfig } from '@expo/config';

import { resolveOptionsAsync } from '../resolveOptions';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
      platforms: ['ios', 'android'],
    },
  })),
}));

describe(resolveOptionsAsync, () => {
  it(`asserts unknown platform`, async () => {
    await expect(resolveOptionsAsync('/', { '--platform': ['foobar'] })).rejects.toThrow(
      /^Unsupported platform "foobar"\./
    );
  });

  it(`asserts not-configured platform`, async () => {
    jest.mocked(getConfig).mockReturnValueOnce({
      // @ts-expect-error
      exp: { web: { bundler: 'webpack' }, platforms: ['ios', 'android', 'web'] },
    });
    await expect(resolveOptionsAsync('/', { '--platform': ['web'] })).rejects.toThrow(
      /^Platform "web" is not configured to use the Metro bundler in the project Expo config,/
    );
  });

  it(`allows multiple platform flags`, async () => {
    await expect(
      resolveOptionsAsync('/', { '--platform': ['android', 'ios'] })
    ).resolves.toMatchObject({
      platforms: ['android', 'ios'],
    });
  });

  it(`filters duplicated platform flags`, async () => {
    await expect(
      resolveOptionsAsync('/', { '--platform': ['android', 'android', 'ios', 'ios'] })
    ).resolves.toMatchObject({
      platforms: ['android', 'ios'],
    });
  });

  it(`filters duplicated platform flags including all`, async () => {
    await expect(
      resolveOptionsAsync('/', { '--platform': ['android', 'all'] })
    ).resolves.toMatchObject({
      platforms: ['android', 'ios'],
    });
  });

  it(`parses qualified options`, async () => {
    await expect(
      resolveOptionsAsync('/', {
        '--output-dir': 'foobar',
        '--platform': ['android'],
        '--clear': true,
        '--dev': true,
        '--dump-assetmap': true,
        '--source-maps': true,
        '--max-workers': 2,
      })
    ).resolves.toEqual({
      clear: true,
      dev: true,
      bytecode: true,
      minify: true,
      dumpAssetmap: true,
      sourceMaps: true,
      maxWorkers: 2,
      outputDir: 'foobar',
      platforms: ['android'],
    });
  });

  it(`parses default options`, async () => {
    await expect(resolveOptionsAsync('/', {})).resolves.toEqual({
      clear: false,
      dev: false,
      bytecode: true,
      minify: true,
      dumpAssetmap: false,
      sourceMaps: false,
      maxWorkers: undefined,
      outputDir: 'dist',
      platforms: ['ios', 'android'],
    });
  });
  it(`parses default options with web enabled`, async () => {
    jest.mocked(getConfig).mockReturnValueOnce({
      // @ts-expect-error
      exp: { web: { bundler: 'metro' }, platforms: ['ios', 'android', 'web'] },
    });
    await expect(resolveOptionsAsync('/', {})).resolves.toEqual(
      expect.objectContaining({
        platforms: ['ios', 'android', 'web'],
      })
    );
  });
});
