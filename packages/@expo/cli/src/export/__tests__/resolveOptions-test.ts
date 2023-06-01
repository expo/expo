import { getConfig } from '@expo/config';

import { asMock } from '../../__tests__/asMock';
import { resolveOptionsAsync } from '../resolveOptions';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

describe(resolveOptionsAsync, () => {
  it(`asserts invalid platform`, async () => {
    await expect(resolveOptionsAsync('/', { '--platform': 'foobar' })).rejects.toThrow(
      /^Unsupported platform "foobar"\./
    );
  });

  it(`parses qualified options`, async () => {
    await expect(
      resolveOptionsAsync('/', {
        '--output-dir': 'foobar',
        '--platform': 'android',
        '--clear': true,
        '--dev': true,
        '--dump-assetmap': true,
        '--dump-sourcemap': true,
        '--max-workers': 2,
      })
    ).resolves.toEqual({
      clear: true,
      dev: true,
      minify: true,
      dumpAssetmap: true,
      dumpSourcemap: true,
      maxWorkers: 2,
      outputDir: 'foobar',
      platforms: ['android'],
    });
  });

  it(`parses default options`, async () => {
    await expect(resolveOptionsAsync('/', {})).resolves.toEqual({
      clear: false,
      dev: false,
      minify: true,
      dumpAssetmap: false,
      dumpSourcemap: false,
      maxWorkers: undefined,
      outputDir: 'dist',
      platforms: ['ios', 'android'],
    });
  });
  it(`parses default options with web enabled`, async () => {
    asMock(getConfig).mockReturnValueOnce({
      // @ts-expect-error
      exp: { web: { bundler: 'metro' } },
    });
    await expect(resolveOptionsAsync('/', {})).resolves.toEqual(
      expect.objectContaining({
        platforms: ['ios', 'android', 'web'],
      })
    );
  });
});
