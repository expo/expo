import { getConfig } from '@expo/config';
import { vol } from 'memfs';

import { exportAppAsync } from '../exportApp';
import { unstable_exportStaticAsync } from '../exportStaticAsync';
import { ExportAssetMap } from '../saveAssets';

jest.mock('../../log');

jest.mock('../../start/doctor/web/WebSupportProjectPrerequisite', () => ({
  WebSupportProjectPrerequisite: jest.fn(() => ({ assertAsync: jest.fn() })),
}));

jest.mock('../exportStaticAsync', () => ({
  unstable_exportStaticAsync: jest.fn(
    async (_root: string, { files }: { files: ExportAssetMap }) => {
      files.set('output-test.txt', {
        contents: 'test',
        targetDomain: 'server',
      });
    }
  ),
}));

jest.mock('@expo/config', () => ({
  getNameFromConfig: () => ({
    appName: 'my-app',
    webName: 'my-app',
  }),
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
    async (_projectRoot, _projectConfig, { platforms }: { platforms: string[] }) =>
      platforms.reduce(
        (prev, platform) => ({
          ...prev,
          [platform]: {
            artifacts: [
              {
                type: 'js',
                metadata: { isAsync: false },
                originFilename: 'index.js',
                filename: `_expo/static/js/${platform}/index-xxx.js`,
                source:
                  'var foo = true;\n//# sourceMappingURL=/_expo/static/js/ios/index-xxx.js.map\n',
              },
              {
                type: 'map',
                originFilename: 'index.js',
                filename: `_expo/static/js/${platform}/index-xxx.js.map`,
                source: `${platform}_map`,
              },
              {
                type: 'css',
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
                scales: [],
              },
            ],
          },
        }),
        {}
      )
  ),
}));

describe(exportAppAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`exports an app for iOS`, async () => {
    const outputDir = '/dist/';

    vol.fromJSON(
      {
        'icon.png': 'icon',
        'package.json': JSON.stringify({ dependencies: { expo: '49.0.0' } }),
      },
      '/'
    );

    await exportAppAsync('/', {
      outputDir,
      minify: true,
      platforms: ['ios'],
      dev: false,
      dumpAssetmap: true,
      sourceMaps: true,
      clear: false,
      // publishOptions: {},
    });

    expect(vol.toJSON()).toStrictEqual({
      '/dist/_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css': expect.stringMatching(/cyan/),
      '/dist/debug.html': expect.stringMatching(/<script/),
      '/dist/assetmap.json': expect.any(String),
      '/dist/assets/4e3f888fc8475f69fd5fa32f1ad5216a': 'icon',
      '/dist/_expo/static/js/ios/index-xxx.js': expect.stringMatching(/sourceMappingURL/),
      '/dist/metadata.json': expect.stringContaining('"fileMetadata"'),
      '/dist/_expo/static/js/ios/index-xxx.js.map': 'ios_map',
      '/icon.png': 'icon',
      '/package.json': expect.any(String),
    });
  });

  it(`exports an app for web in SPA mode`, async () => {
    jest.mocked(getConfig).mockReturnValue({
      // @ts-expect-error
      exp: { web: { bundler: 'metro' } },
    });

    const outputDir = '/dist/';

    vol.fromJSON(
      {
        'icon.png': 'icon',
        'package.json': JSON.stringify({ dependencies: { expo: '49.0.0' } }),
        'public/index.html': '<!DOCTYPE html>\n<html>\n<head></head>\n<body></body>\n</html>\n',
      },
      '/'
    );

    await exportAppAsync('/', {
      outputDir,
      minify: true,
      platforms: ['web'],
      dev: false,
      dumpAssetmap: true,
      sourceMaps: true,
      clear: false,
    });

    expect(vol.toJSON()).toStrictEqual({
      '/dist/_expo/static/css/bc6aa0a69dcebf8e8cac1faa76705756.css': expect.stringMatching(/cyan/),
      '/dist/_expo/static/js/web/index-xxx.js': expect.stringMatching(/sourceMappingURL/),
      '/dist/_expo/static/js/web/index-xxx.js.map': 'web_map',
      '/dist/debug.html': expect.stringMatching(/<script/),
      '/dist/index.html': expect.stringMatching(/html/),
      '/dist/assetmap.json': expect.any(String),
      '/dist/metadata.json': expect.stringContaining('"fileMetadata"'),

      '/icon.png': 'icon',
      '/package.json': expect.any(String),
      '/public/index.html': expect.any(String),
    });

    expect(unstable_exportStaticAsync).not.toHaveBeenCalled();
  });

  it(`exports an app for web in server mode`, async () => {
    jest.mocked(getConfig).mockReturnValue({
      // @ts-expect-error
      exp: { web: { bundler: 'metro', output: 'server' } },
    });

    const outputDir = '/dist/';

    vol.fromJSON(
      {
        'icon.png': 'icon',
        'package.json': JSON.stringify({ dependencies: { expo: '49.0.0' } }),
        'public/index.html': '<!DOCTYPE html>\n<html>\n<head></head>\n<body></body>\n</html>\n',
      },
      '/'
    );

    await exportAppAsync('/', {
      outputDir,
      minify: true,
      platforms: ['web'],
      dev: false,
      dumpAssetmap: true,
      sourceMaps: true,
      clear: false,
    });

    expect(vol.toJSON()).toStrictEqual({
      '/dist/server/output-test.txt': 'test',
      '/dist/client/index.html': expect.stringMatching(/html/),
      '/dist/index.html': expect.stringMatching(/html/),

      '/icon.png': 'icon',
      '/package.json': expect.any(String),
      '/public/index.html': expect.any(String),
    });

    expect(unstable_exportStaticAsync).toHaveBeenCalled();
  });
});
