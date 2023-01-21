/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { execute, projectRoot, getLoadedModulesAsync, setupTestProjectAsync, bin } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

beforeAll(async () => {
  await fs.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(`require('../../build/src/export').expoExport`);
  expect(modules).toStrictEqual([
    '../node_modules/arg/index.js',
    '../node_modules/chalk/node_modules/ansi-styles/index.js',
    '../node_modules/chalk/source/index.js',
    '../node_modules/chalk/source/util.js',
    '../node_modules/has-flag/index.js',
    '../node_modules/supports-color/index.js',
    '@expo/cli/build/src/export/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo export --help`', async () => {
  const results = await execute('export', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Export the static files of the app for hosting it on a web server

      Usage
        $ npx expo export <dir>

      Options
        <dir>                      Directory of the Expo project. Default: Current working directory
        --dev                      Configure static files for developing locally using a non-https server
        --output-dir <dir>         The directory to export the static files to. Default: dist
        --max-workers <number>     Maximum number of tasks to allow the bundler to spawn
        --dump-assetmap            Dump the asset map for further processing
        --dump-sourcemap           Dump the source map for debugging the JS bundle
        -p, --platform <platform>  Options: android, ios, web, all. Default: all
        -c, --clear                Clear the bundler cache
        -h, --help                 Usage info
    "
  `);
});

it(
  'runs `npx expo export`',
  async () => {
    const projectRoot = await setupTestProjectAsync('basic-export', 'with-assets');
    // `npx expo export`
    await execa('node', [bin, 'export', '--dump-sourcemap', '--dump-assetmap'], {
      cwd: projectRoot,
    });

    const outputDir = path.join(projectRoot, 'dist');
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);

    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));

    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        android: {
          assets: [
            {
              ext: 'png',
              path: 'assets/fb960eb5e4eb49ec8786c7f6c4a57ce2',
            },
            {
              ext: 'png',
              path: 'assets/9ce7db807e4147e00df372d053c154c2',
            },
            {
              ext: 'ttf',
              path: 'assets/3858f62230ac3c915f300c664312c63f',
            },
          ],
          bundle: expect.stringMatching(/bundles\/android-.*\.js/),
        },
        ios: {
          assets: [
            {
              ext: 'png',
              path: 'assets/fb960eb5e4eb49ec8786c7f6c4a57ce2',
            },
            {
              ext: 'png',
              path: 'assets/9ce7db807e4147e00df372d053c154c2',
            },
            {
              ext: 'ttf',
              path: 'assets/2f334f6c7ca5b2a504bdf8acdee104f3',
            },
          ],
          bundle: expect.stringMatching(/bundles\/ios-.*\.js/),
        },
        web: {
          assets: [
            {
              ext: 'png',
              path: 'assets/fb960eb5e4eb49ec8786c7f6c4a57ce2',
            },
            {
              ext: 'png',
              path: 'assets/9ce7db807e4147e00df372d053c154c2',
            },
            {
              ext: 'ttf',
              path: 'assets/3858f62230ac3c915f300c664312c63f',
            },
          ],
          bundle: expect.stringMatching(/bundles\/web-.*\.js/),
        },
      },
      version: 0,
    });

    const assetmap = await JsonFile.readAsync(path.resolve(outputDir, 'assetmap.json'));
    expect(assetmap).toEqual({
      '2f334f6c7ca5b2a504bdf8acdee104f3': {
        __packager_asset: true,
        fileHashes: ['2f334f6c7ca5b2a504bdf8acdee104f3'],
        fileSystemLocation: expect.stringMatching(/\/.*\/basic-export\/assets/),
        files: [expect.stringMatching(/\/.*\/basic-export\/assets\/font\.ios\.ttf/)],
        hash: '2f334f6c7ca5b2a504bdf8acdee104f3',
        httpServerLocation: '/assets/assets',
        name: 'font',
        scales: [1],
        type: 'ttf',
      },

      '3858f62230ac3c915f300c664312c63f': {
        __packager_asset: true,
        fileHashes: ['3858f62230ac3c915f300c664312c63f'],
        fileSystemLocation: expect.stringMatching(/\/.*\/basic-export\/assets/),
        files: [expect.stringMatching(/\/.*\/basic-export\/assets\/font\.ttf/)],
        hash: '3858f62230ac3c915f300c664312c63f',
        httpServerLocation: '/assets/assets',
        name: 'font',
        scales: [1],
        type: 'ttf',
      },
      d48d481475a80809fcf9253a765193d1: {
        __packager_asset: true,
        fileHashes: ['fb960eb5e4eb49ec8786c7f6c4a57ce2', '9ce7db807e4147e00df372d053c154c2'],
        fileSystemLocation: expect.stringMatching(/\/.*\/basic-export\/assets/),
        files: [
          expect.stringMatching(/\/.*\/basic-export\/assets\/icon\.png/),
          expect.stringMatching(/\/.*\/basic-export\/assets\/icon@2x\.png/),
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
    expect(files).toEqual([
      'assetmap.json',
      'assets/2f334f6c7ca5b2a504bdf8acdee104f3',
      'assets/3858f62230ac3c915f300c664312c63f',
      'assets/9ce7db807e4147e00df372d053c154c2',
      'assets/assets/font.ttf',
      'assets/assets/icon.png',
      'assets/assets/icon@2x.png',

      'assets/fb960eb5e4eb49ec8786c7f6c4a57ce2',
      expect.stringMatching(/bundles\/android-[\w\d]+\.js/),
      expect.stringMatching(/bundles\/android-[\w\d]+\.map/),
      expect.stringMatching(/bundles\/ios-[\w\d]+\.js/),
      expect.stringMatching(/bundles\/ios-[\w\d]+\.map/),
      expect.stringMatching(/bundles\/web-[\w\d]+\.js/),
      expect.stringMatching(/bundles\/web-[\w\d]+\.map/),
      'debug.html',
      'drawable-mdpi/assets_icon.png',
      'drawable-xhdpi/assets_icon.png',
      'favicon.ico',
      'index.html',
      'metadata.json',
      'raw/assets_font.ttf',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
