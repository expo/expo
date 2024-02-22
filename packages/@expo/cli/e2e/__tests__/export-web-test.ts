/* eslint-env jest */
import JsonFile from '@expo/json-file';
import assert from 'assert';
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
  const results = await execute('export:web', '--help');
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

it(
  'runs `npx expo export:web`',
  async () => {
    const projectRoot = await setupTestProjectAsync('basic-export-web', 'with-web');
    // `npx expo export:web`
    await execa('node', [bin, 'export:web'], {
      cwd: projectRoot,
    });

    const outputDir = path.join(projectRoot, 'web-build');
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

    const assetsManifest = await JsonFile.readAsync(path.resolve(outputDir, 'asset-manifest.json'));
    expect(assetsManifest.entrypoints).toEqual([
      expect.stringMatching(/static\/js\/\d+\.[a-z\d]+\.js/),
      expect.stringMatching(/static\/js\/main\.[a-z\d]+\.js/),
    ]);

    const knownFiles = [
      ['main.js', expect.stringMatching(/static\/js\/main\.[a-z\d]+\.js/)],
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
      expect(key).toMatch(/(static\/js\/)?(\d+|main)\.[a-z\d]+\.js(\.LICENSE\.txt|\.map)?/);
      expect(value).toMatch(/(static\/js\/)?(\d+|main)\.[a-z\d]+\.js(\.LICENSE\.txt|\.map)?/);
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
    expect(files).toEqual([
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
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
