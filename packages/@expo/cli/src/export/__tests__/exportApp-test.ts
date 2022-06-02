import { vol } from 'memfs';

import { exportAppAsync } from '../exportApp';

jest.mock('../../log');

jest.mock('../createBundles', () => ({
  createBundlesAsync: jest.fn(
    async (projectRoot, options, { platforms }: { platforms: string[] }) =>
      platforms.reduce(
        (prev, platform) => ({
          ...prev,
          [platform]: {
            code: `var foo = true;`,
            map: `${platform}_map`,
            assets: [
              {
                __packager_asset: true,
                files: ['/icon.png'],
                hash: '4e3f888fc8475f69fd5fa32f1ad5216a',
                name: 'icon',
                type: 'png',
                fileHashes: ['4e3f888fc8475f69fd5fa32f1ad5216a'],
              },
            ],
          },
        }),
        {}
      )
  ),
}));

describe(exportAppAsync, () => {
  afterAll(() => {
    vol.reset();
  });

  it(`exports an app`, async () => {
    const outputDir = '/dist/';

    vol.fromJSON(
      {
        'icon.png': 'icon',
        'package.json': JSON.stringify({ dependencies: { expo: '44.0.0' } }),
      },
      '/'
    );

    await exportAppAsync('/', {
      outputDir,
      platforms: ['ios'],
      dev: false,
      dumpAssetmap: true,
      dumpSourcemap: true,
      clear: false,
      // publishOptions: {},
    });

    expect(vol.toJSON()).toStrictEqual({
      '/dist/debug.html': expect.stringMatching(/<script/),
      '/dist/assetmap.json': expect.any(String),
      '/dist/assets/4e3f888fc8475f69fd5fa32f1ad5216a': 'icon',
      '/dist/bundles/ios-4fe3891dcaca43901bd8797db78405e4.js':
        expect.stringMatching(/sourceMappingURL/),
      '/dist/metadata.json': expect.stringContaining('"fileMetadata"'),
      '/dist/bundles/ios-4fe3891dcaca43901bd8797db78405e4.map': 'ios_map',
      '/icon.png': 'icon',
      '/package.json': expect.any(String),
    });
  });
});
