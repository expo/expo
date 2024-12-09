/* eslint-env jest */
import JsonFile from '@expo/json-file';
import assert from 'assert';
import fs from 'fs';
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
  await fs.promises.mkdir(projectRoot, { recursive: true });
  process.env.FORCE_COLOR = '0';
  process.env.CI = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(
    `require('../../build/src/export/web').expoExportWeb`
  );
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/export/web/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo export:web --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['export:web', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        (Deprecated) Bundle the static files of the web app with Webpack for hosting on a web server

      Usage
        $ npx expo export:web <dir>

      Options
        <dir>                         Directory of the Expo project. Default: Current working directory
        --dev                         Bundle in development mode
        -c, --clear                   Clear the bundler cache
        -h, --help                    Usage info
    "
  `);
});

it('runs `npx expo export:web`', async () => {
  const projectRoot = await setupTestProjectWithOptionsAsync('basic-export-web', 'with-web');

  // `npx expo export:web`
  await executeExpoAsync(projectRoot, ['export:web']);

  const outputDir = path.join(projectRoot, 'web-build');

  const assetsManifest = await JsonFile.readAsync(path.resolve(outputDir, 'asset-manifest.json'));
  expect(assetsManifest.entrypoints).toEqual([
    expect.pathMatching(/static\/js\/\d+\.[a-z\d]+\.js$/),
    expect.pathMatching(/static\/js\/main\.[a-z\d]+\.js$/),
  ]);

  const knownFiles = [
    ['main.js', expect.pathMatching(/static\/js\/main\.[a-z\d]+\.js$/)],
    ['index.html', '/index.html'],
    ['manifest.json', '/manifest.json'],
    ['serve.json', '/serve.json'],
  ];

  assert(assetsManifest.files);
  console.log(assetsManifest.files);
  for (const [key, value] of knownFiles) {
    const files = assetsManifest.files as Record<string, string>;
    expect(files[key]).toEqual(value);
    delete files[key];
  }

  for (const [key, value] of Object.entries(assetsManifest?.files ?? {})) {
    expect(key).toMatchPath(/(static\/js\/)?(\d+|main)\.[a-z\d]+\.js(\.LICENSE\.txt|\.map)?$/);
    expect(value).toMatchPath(/(static\/js\/)?(\d+|main)\.[a-z\d]+\.js(\.LICENSE\.txt|\.map)?$/);
  }

  expect(await JsonFile.readAsync(path.resolve(outputDir, 'manifest.json'))).toEqual({
    display: 'standalone',
    lang: 'en',
    name: 'basic-export-web',
    prefer_related_applications: true,
    related_applications: [
      {
        id: 'com.example.minimal',
        platform: 'itunes',
      },
      {
        id: 'com.example.minimal',
        platform: 'play',
        url: 'http://play.google.com/store/apps/details?id=com.example.minimal',
      },
    ],
    short_name: 'basic-export-web',
    start_url: '/?utm_source=web_app_manifest',
  });
  expect(await JsonFile.readAsync(path.resolve(outputDir, 'serve.json'))).toEqual({
    headers: [
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: 'static/**/*.js',
      },
    ],
  });

  // If this changes then everything else probably changed as well.
  expect(findProjectFiles(outputDir)).toEqual([
    'asset-manifest.json',
    'index.html',
    'manifest.json',
    'serve.json',
    expect.stringMatching(/static\/js\/\d+\.[a-z\d]+\.js/),
    expect.stringMatching(/static\/js\/\d+\.[a-z\d]+\.js\.LICENSE\.txt/),
    expect.stringMatching(/static\/js\/\d+\.[a-z\d]+\.js\.map/),
    expect.stringMatching(/static\/js\/main\.[a-z\d]+\.js/),
    expect.stringMatching(/static\/js\/main\.[a-z\d]+\.js\.map/),
  ]);
});
