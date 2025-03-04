/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs/promises';
import { sync as globSync } from 'glob';
import crypto from 'node:crypto';
import path from 'path';

import {
  projectRoot,
  getLoadedModulesAsync,
  setupTestProjectWithOptionsAsync,
  findProjectFiles,
} from './utils';
import { executeExpoAsync } from '../utils/expo';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
  process.env._EXPO_E2E_USE_PATH_ALIASES = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  delete process.env._EXPO_E2E_USE_PATH_ALIASES;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/export').expoExport`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/export/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo export --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['export', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Export the static files of the app for hosting it on a web server

      Usage
        $ npx expo export <dir>

      Options
        <dir>                      Directory of the Expo project. Default: Current working directory
        --output-dir <dir>         The directory to export the static files to. Default: dist
        --dev                      Configure static files for developing locally using a non-https server
        --no-minify                Prevent minifying source
        --no-bytecode              Prevent generating Hermes bytecode
        --max-workers <number>     Maximum number of tasks to allow the bundler to spawn
        --dump-assetmap            Emit an asset map for further processing
        --no-ssg                   Skip exporting static HTML files for web routes
        -p, --platform <platform>  Options: android, ios, web, all. Default: all
        -s, --source-maps          Emit JavaScript source maps
        -c, --clear                Clear the bundler cache
        -h, --help                 Usage info
    "
  `);
});

describe('server', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await setupTestProjectWithOptionsAsync('basic-export', 'with-assets');
  });

  it('runs `npx expo export`', async () => {
    // `npx expo export`
    await executeExpoAsync(projectRoot, ['export', '--source-maps', '--dump-assetmap'], {
      env: {
        NODE_ENV: 'production',
        TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
        EXPO_USE_FAST_RESOLVER: 'true',
      },
    });

    const outputDir = path.join(projectRoot, 'dist');
    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));

    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        android: {
          assets: [
            {
              ext: 'png',
              path: expect.pathMatching('assets/fb960eb5e4eb49ec8786c7f6c4a57ce2'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/9ce7db807e4147e00df372d053c154c2'),
            },
            {
              ext: 'ttf',
              path: expect.pathMatching('assets/3858f62230ac3c915f300c664312c63f'),
            },
          ],
          bundle: expect.pathMatching(/_expo\/static\/js\/android\/AppEntry-.*\.hbc$/),
        },
        ios: {
          assets: [
            {
              ext: 'png',
              path: expect.pathMatching('assets/fb960eb5e4eb49ec8786c7f6c4a57ce2'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/9ce7db807e4147e00df372d053c154c2'),
            },
            {
              ext: 'ttf',
              path: expect.pathMatching('assets/2f334f6c7ca5b2a504bdf8acdee104f3'),
            },
          ],
          bundle: expect.pathMatching(/_expo\/static\/js\/ios\/AppEntry-.*\.hbc$/),
        },
      },
      version: 0,
    });

    const assetmap = await JsonFile.readAsync(path.resolve(outputDir, 'assetmap.json'));
    expect(assetmap).toEqual({
      '2f334f6c7ca5b2a504bdf8acdee104f3': {
        __packager_asset: true,
        fileHashes: ['2f334f6c7ca5b2a504bdf8acdee104f3'],
        fileSystemLocation: expect.pathMatching(/\/.*\/basic-export\/assets$/),
        files: [expect.pathMatching(/\/.*\/basic-export\/assets\/font\.ios\.ttf$/)],
        hash: '2f334f6c7ca5b2a504bdf8acdee104f3',
        httpServerLocation: '/assets/assets',
        name: 'font',
        scales: [1],
        type: 'ttf',
      },

      '3858f62230ac3c915f300c664312c63f': {
        __packager_asset: true,
        fileHashes: ['3858f62230ac3c915f300c664312c63f'],
        fileSystemLocation: expect.pathMatching(/\/.*\/basic-export\/assets$/),
        files: [expect.pathMatching(/\/.*\/basic-export\/assets\/font\.ttf$/)],
        hash: '3858f62230ac3c915f300c664312c63f',
        httpServerLocation: '/assets/assets',
        name: 'font',
        scales: [1],
        type: 'ttf',
      },
      d48d481475a80809fcf9253a765193d1: {
        __packager_asset: true,
        fileHashes: ['fb960eb5e4eb49ec8786c7f6c4a57ce2', '9ce7db807e4147e00df372d053c154c2'],
        fileSystemLocation: expect.pathMatching(/\/.*\/basic-export\/assets$/),
        files: [
          expect.pathMatching(/\/.*\/basic-export\/assets\/icon\.png$/),
          expect.pathMatching(/\/.*\/basic-export\/assets\/icon@2x\.png$/),
        ],
        hash: 'd48d481475a80809fcf9253a765193d1',
        height: 1,
        httpServerLocation: '/assets/assets',
        name: 'icon',
        scales: [1, 2],
        type: 'png',
        width: 1,
      },
    });

    // If this changes then everything else probably changed as well.
    expect(findProjectFiles(outputDir)).toEqual([
      expect.stringMatching(/_expo\/static\/js\/android\/AppEntry-[\w\d]+\.hbc$/),
      expect.stringMatching(/_expo\/static\/js\/android\/AppEntry-[\w\d]+\.hbc\.map$/),
      expect.stringMatching(/_expo\/static\/js\/ios\/AppEntry-[\w\d]+\.hbc$/),
      expect.stringMatching(/_expo\/static\/js\/ios\/AppEntry-[\w\d]+\.hbc\.map$/),
      expect.stringMatching(/_expo\/static\/js\/web\/AppEntry-[\w\d]+\.js$/),
      expect.stringMatching(/_expo\/static\/js\/web\/AppEntry-[\w\d]+\.js\.map$/),
      'assetmap.json',
      'assets/2f334f6c7ca5b2a504bdf8acdee104f3',
      'assets/3858f62230ac3c915f300c664312c63f',
      'assets/9ce7db807e4147e00df372d053c154c2',
      'assets/assets/font.3858f62230ac3c915f300c664312c63f.ttf',
      'assets/assets/icon.8034d8318b239108719ff3f22f31ef15.png',
      'assets/assets/icon.8034d8318b239108719ff3f22f31ef15@2x.png',

      'assets/fb960eb5e4eb49ec8786c7f6c4a57ce2',
      'favicon.ico',
      'index.html',
      'metadata.json',
    ]);
  });

  it('runs `npx expo export --no-bytecode`', async () => {
    // `npx expo export`
    await executeExpoAsync(
      projectRoot,
      ['export', '--source-maps', '--no-bytecode', '--dump-assetmap', '--platform', 'ios'],
      {
        env: {
          NODE_ENV: 'production',
          TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      }
    );

    const outputDir = path.join(projectRoot, 'dist');
    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));

    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        ios: {
          assets: [
            {
              ext: 'png',
              path: expect.pathMatching('assets/fb960eb5e4eb49ec8786c7f6c4a57ce2'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/9ce7db807e4147e00df372d053c154c2'),
            },
            {
              ext: 'ttf',
              path: expect.pathMatching('assets/2f334f6c7ca5b2a504bdf8acdee104f3'),
            },
          ],
          bundle: expect.pathMatching(/_expo\/static\/js\/ios\/AppEntry-.*\.js$/),
        },
      },
      version: 0,
    });

    const assetmap = await JsonFile.readAsync(path.resolve(outputDir, 'assetmap.json'));
    expect(assetmap).toEqual({
      '2f334f6c7ca5b2a504bdf8acdee104f3': {
        __packager_asset: true,
        fileHashes: ['2f334f6c7ca5b2a504bdf8acdee104f3'],
        fileSystemLocation: expect.pathMatching(/\/.*\/basic-export\/assets$/),
        files: [expect.pathMatching(/\/.*\/basic-export\/assets\/font\.ios\.ttf$/)],
        hash: '2f334f6c7ca5b2a504bdf8acdee104f3',
        httpServerLocation: '/assets/assets',
        name: 'font',
        scales: [1],
        type: 'ttf',
      },
      d48d481475a80809fcf9253a765193d1: {
        __packager_asset: true,
        fileHashes: ['fb960eb5e4eb49ec8786c7f6c4a57ce2', '9ce7db807e4147e00df372d053c154c2'],
        fileSystemLocation: expect.pathMatching(/\/.*\/basic-export\/assets$/),
        files: [
          expect.pathMatching(/\/.*\/basic-export\/assets\/icon\.png$/),
          expect.pathMatching(/\/.*\/basic-export\/assets\/icon@2x\.png$/),
        ],
        hash: 'd48d481475a80809fcf9253a765193d1',
        height: 1,
        httpServerLocation: '/assets/assets',
        name: 'icon',
        scales: [1, 2],
        type: 'png',
        width: 1,
      },
    });

    // If this changes then everything else probably changed as well.
    expect(findProjectFiles(outputDir)).toEqual([
      expect.stringMatching(/_expo\/static\/js\/ios\/AppEntry-[\w\d]+\.js/),
      expect.stringMatching(/_expo\/static\/js\/ios\/AppEntry-[\w\d]+\.js\.map/),
      'assetmap.json',
      'assets/2f334f6c7ca5b2a504bdf8acdee104f3',
      'assets/9ce7db807e4147e00df372d053c154c2',
      'assets/fb960eb5e4eb49ec8786c7f6c4a57ce2',
      'favicon.ico',
      'metadata.json',
    ]);

    // Check if the bundle is minified
    const bundlePath = globSync('**/*.js', {
      cwd: path.join(outputDir, '_expo'),
      absolute: true,
    })[0];

    const bundle = await fs.readFile(bundlePath, 'utf8');

    expect(bundle).toMatch('__d(');
    // General check. This may need to be tweaked as React Native or other
    // packages change. If it is significantly larger than the threshold,
    // log and diff the `bundle` with the a previous version from a branch
    // where this passes.
    expect(bundle.split('\n').length).toBeLessThan(700);
  });
});

describe('DOM Components', () => {
  let projectRoot: string;

  beforeAll(async () => {
    projectRoot = await setupTestProjectWithOptionsAsync('dom-export', 'with-dom');

    // TODO(kudo,20250304): Remove this once we publish `@expo/metro-config` with DOM components fixes.
    const srcMetroConfig = path.resolve(__dirname, '../../../metro-config/build');
    const destMetroConfig = path.join(projectRoot, 'node_modules/@expo/metro-config/build');
    await fs.cp(srcMetroConfig, destMetroConfig, { recursive: true, force: true });
  });

  it('runs `npx expo export`', async () => {
    // `npx expo export`
    await executeExpoAsync(
      projectRoot,
      ['export', '--source-maps', '--dump-assetmap', '--platform', 'ios'],
      {
        env: {
          NODE_ENV: 'production',
          TEST_BABEL_PRESET_EXPO_MODULE_ID: require.resolve('babel-preset-expo'),
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      }
    );

    const outputDir = path.join(projectRoot, 'dist');
    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));

    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        ios: {
          assets: [
            {
              ext: 'png',
              path: expect.pathMatching('assets/5b50965d3dfbc518fe50ce36c314a6ec'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/e62addcde857ebdb7342e6b9f1095e97'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/4f355ba1efca4b9c0e7a6271af047f61'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/817aca47ff3cea63020753d336e628a4'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/369745d4a4a6fa62fa0ed495f89aa964'),
            },
            {
              ext: 'ttf',
              path: expect.pathMatching('assets/3858f62230ac3c915f300c664312c63f'),
            },
            {
              ext: 'png',
              path: expect.pathMatching('assets/fb960eb5e4eb49ec8786c7f6c4a57ce2'),
            },
            {
              ext: 'js',
              path: expect.pathMatching('www.bundle/9d68fed0bc0ccf1d7fa0017680bf475f.js'),
            },
            {
              ext: 'css',
              path: expect.pathMatching('www.bundle/f85bc9fc5dd55297c7f68763d859ab65.css'),
            },
            {
              ext: 'html',
              path: expect.pathMatching('www.bundle/8cd7894acaed726be21f3e985bdfc887.html'),
            },
          ],
          bundle: expect.pathMatching(/_expo\/static\/js\/ios\/AppEntry-.*\.hbc$/),
        },
      },
      version: 0,
    });

    const assetmap = await JsonFile.readAsync(path.resolve(outputDir, 'assetmap.json'));
    expect(assetmap).toEqual({
      '369745d4a4a6fa62fa0ed495f89aa964': {
        __packager_asset: true,
        fileHashes: ['369745d4a4a6fa62fa0ed495f89aa964'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/close\.png$/)],
        hash: '369745d4a4a6fa62fa0ed495f89aa964',
        height: 28,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'close.369745d4a4a6fa62fa0ed495f89aa964',
        scales: [1],
        type: 'png',
        width: 28,
      },
      '3858f62230ac3c915f300c664312c63f': {
        __packager_asset: true,
        fileHashes: ['3858f62230ac3c915f300c664312c63f'],
        fileSystemLocation: expect.pathMatching(/\/.*\/dom-export\/assets$/),
        files: [expect.pathMatching(/\/.*\/dom-export\/assets\/font\.ttf$/)],
        hash: '3858f62230ac3c915f300c664312c63f',
        httpServerLocation: './assets/assets',
        name: 'font.3858f62230ac3c915f300c664312c63f',
        scales: [1],
        type: 'ttf',
      },
      '4f355ba1efca4b9c0e7a6271af047f61': {
        __packager_asset: true,
        fileHashes: ['4f355ba1efca4b9c0e7a6271af047f61'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/alert-triangle\.png$/)],
        hash: '4f355ba1efca4b9c0e7a6271af047f61',
        height: 42,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'alert-triangle.4f355ba1efca4b9c0e7a6271af047f61',
        scales: [1],
        type: 'png',
        width: 48,
      },
      '5b50965d3dfbc518fe50ce36c314a6ec': {
        __packager_asset: true,
        fileHashes: ['5b50965d3dfbc518fe50ce36c314a6ec'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/chevron-left\.png$/)],
        hash: '5b50965d3dfbc518fe50ce36c314a6ec',
        height: 28,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'chevron-left.5b50965d3dfbc518fe50ce36c314a6ec',
        scales: [1],
        type: 'png',
        width: 16,
      },
      '817aca47ff3cea63020753d336e628a4': {
        __packager_asset: true,
        fileHashes: ['817aca47ff3cea63020753d336e628a4'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/loader\.png$/)],
        hash: '817aca47ff3cea63020753d336e628a4',
        height: 44,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'loader.817aca47ff3cea63020753d336e628a4',
        scales: [1],
        type: 'png',
        width: 44,
      },
      e62addcde857ebdb7342e6b9f1095e97: {
        __packager_asset: true,
        fileHashes: ['e62addcde857ebdb7342e6b9f1095e97'],
        fileSystemLocation: expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets$/),
        files: [expect.pathMatching(/\/.*\/@expo\/metro-runtime\/assets\/chevron-right\.png$/)],
        hash: 'e62addcde857ebdb7342e6b9f1095e97',
        height: 28,
        httpServerLocation: './assets/node_modules/@expo/metro-runtime/assets',
        name: 'chevron-right.e62addcde857ebdb7342e6b9f1095e97',
        scales: [1],
        type: 'png',
        width: 16,
      },
      fb960eb5e4eb49ec8786c7f6c4a57ce2: {
        __packager_asset: true,
        fileHashes: ['fb960eb5e4eb49ec8786c7f6c4a57ce2'],
        fileSystemLocation: expect.pathMatching(/\/.*\/assets$/),
        files: [expect.pathMatching(/\/.*\/assets\/icon\.png$/)],
        hash: 'fb960eb5e4eb49ec8786c7f6c4a57ce2',
        height: 1,
        httpServerLocation: './assets/assets',
        name: 'icon.fb960eb5e4eb49ec8786c7f6c4a57ce2',
        scales: [1],
        type: 'png',
        width: 1,
      },
    });

    // If this changes then everything else probably changed as well.
    expect(findProjectFiles(outputDir)).toEqual([
      expect.stringMatching(/_expo\/static\/js\/ios\/AppEntry-[\w\d]+\.hbc$/),
      expect.stringMatching(/_expo\/static\/js\/ios\/AppEntry-[\w\d]+\.hbc\.map$/),
      'assetmap.json',
      'assets/369745d4a4a6fa62fa0ed495f89aa964',
      'assets/3858f62230ac3c915f300c664312c63f',
      'assets/4f355ba1efca4b9c0e7a6271af047f61',
      'assets/5b50965d3dfbc518fe50ce36c314a6ec',
      'assets/817aca47ff3cea63020753d336e628a4',
      'assets/e62addcde857ebdb7342e6b9f1095e97',
      'assets/fb960eb5e4eb49ec8786c7f6c4a57ce2',

      'metadata.json',

      'www.bundle/5fc2b4814e800cfc11659d9f75e0a7e9.map',
      'www.bundle/8cd7894acaed726be21f3e985bdfc887.html',
      'www.bundle/9d68fed0bc0ccf1d7fa0017680bf475f.js',
      'www.bundle/f85bc9fc5dd55297c7f68763d859ab65.css',
    ]);

    // Test MD5 naming from native bundle to DOM component HTML entry
    const nativeBundlePath = globSync('**/*.{hbc,js}', {
      cwd: path.join(outputDir, '_expo/static/js/ios'),
      absolute: true,
    })[0];
    const domEntry = await fs.readFile(
      path.join(outputDir, '/www.bundle/8cd7894acaed726be21f3e985bdfc887.html'),
      'utf8'
    );
    const md5HtmlBundle = crypto.createHash('md5').update(domEntry).digest('hex');
    const nativeBundle = await fs.readFile(nativeBundlePath);
    expect(nativeBundle.indexOf(Buffer.from(`${md5HtmlBundle}.html`))).toBeGreaterThan(-1);

    // <script src> should link to MD5 named JS bundle
    const domJsBundleContent = await fs.readFile(
      path.join(outputDir, 'www.bundle/9d68fed0bc0ccf1d7fa0017680bf475f.js'),
      'utf8'
    );
    const md5DomJsBundle = crypto.createHash('md5').update(domJsBundleContent).digest('hex');
    expect(
      domEntry.indexOf(`<script src="./${md5DomJsBundle}.js" defer></script>`)
    ).toBeGreaterThan(-1);

    // <link href> should link to MD5 named CSS bundle
    const domCssContent = await fs.readFile(
      path.join(outputDir, 'www.bundle/f85bc9fc5dd55297c7f68763d859ab65.css'),
      'utf8'
    );
    const md5DomCss = crypto.createHash('md5').update(domCssContent).digest('hex');
    expect(
      domEntry.indexOf(`<link rel="preload" href="./${md5DomCss}.css" as="style">`)
    ).toBeGreaterThan(-1);

    // Assets
    const iconAssetModule = `__d((function(g,r,i,a,m,e,d){m.exports={uri:"fb960eb5e4eb49ec8786c7f6c4a57ce2.png",`;
    expect(domJsBundleContent.indexOf(iconAssetModule)).toBeGreaterThan(-1);

    // DOM component JS bundle should link to MD5 named assets
    const ttfModule = `__d((function(g,r,i,a,m,e,d){m.exports="3858f62230ac3c915f300c664312c63f.ttf"}),`;
    expect(domJsBundleContent.indexOf(ttfModule)).toBeGreaterThan(-1);
  });
});
