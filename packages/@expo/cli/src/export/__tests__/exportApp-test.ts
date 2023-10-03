import { vol } from 'memfs';

import { exportAppAsync } from '../exportApp';

jest.mock('../../log');

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '49.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

jest.mock('../fork-bundleAsync', () => ({
  createBundlesAsync: jest.fn(
    async (projectRoot, projectConfig, { platforms }: { platforms: string[] }) =>
      platforms.reduce(
        (prev, platform) => ({
          ...prev,
          [platform]: {
            code: `var foo = true;`,
            map: `${platform}_map`,
            css: [
              {
                originFilename: 'styles.css',
                filename: `_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css`,
                source: '\ndiv {\n    background: cyan;\n}\n\n',
              },
            ],
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
      minify: true,
      platforms: ['ios'],
      dev: false,
      dumpAssetmap: true,
      dumpSourcemap: true,
      clear: false,
      // publishOptions: {},
    });

    expect(vol.toJSON()).toStrictEqual({
      // '/dist/_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css': expect.stringMatching(/cyan/),
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
