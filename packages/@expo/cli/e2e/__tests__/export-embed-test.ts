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
  process.env.EXPO_USE_PATH_ALIASES = '1';
});

afterAll(() => {
  process.env.FORCE_COLOR = originalForceColor;
  process.env.CI = originalCI;
  delete process.env.EXPO_USE_PATH_ALIASES;
});

it('loads expected modules by default', async () => {
  const modules = await getLoadedModulesAsync(
    `require('../../build/src/export/embed').expoExportEmbed`
  );
  expect(modules).toStrictEqual([
    '../node_modules/arg/index.js',
    '../node_modules/chalk/node_modules/ansi-styles/index.js',
    '../node_modules/chalk/source/index.js',
    '../node_modules/chalk/source/util.js',
    '../node_modules/has-flag/index.js',
    '../node_modules/supports-color/index.js',
    '@expo/cli/build/src/export/embed/index.js',
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/utils/args.js',
  ]);
});

it('runs `npx expo export:embed --help`', async () => {
  const results = await execute('export:embed', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        (Internal) Export the JavaScript bundle during a native build script for embedding in a native binary

      Usage
        $ npx expo export:embed <dir>

      Options
        <dir>                                  Directory of the Expo project. Default: Current working directory
        --entry-file <path>                    Path to the root JS file, either absolute or relative to JS root
        --platform <string>                    Either "ios" or "android" (default: "ios")
        --transformer <string>                 Specify a custom transformer to be used
        --dev [boolean]                        If false, warnings are disabled and the bundle is minified (default: true)
        --minify [boolean]                     Allows overriding whether bundle is minified. This defaults to false if dev is true, and true if dev is false. Disabling minification can be useful for speeding up production builds for testing purposes.
        --bundle-output <string>               File name where to store the resulting bundle, ex. /tmp/groups.bundle
        --bundle-encoding <string>             Encoding the bundle should be written in (https://nodejs.org/api/buffer.html#buffer_buffer). (default: "utf8")
        --max-workers <number>                 Specifies the maximum number of workers the worker-pool will spawn for transforming files. This defaults to the number of the cores available on your machine.
        --sourcemap-output <string>            File name where to store the sourcemap file for resulting bundle, ex. /tmp/groups.map
        --sourcemap-sources-root <string>      Path to make sourcemap's sources entries relative to, ex. /root/dir
        --sourcemap-use-absolute-path          Report SourceMapURL using its full path
        --assets-dest <string>                 Directory name where to store assets referenced in the bundle
        --unstable-transform-profile <string>  Experimental, transform JS for a specific JS engine. Currently supported: hermes, hermes-canary, default
        --reset-cache                          Removes cached files
        --config <string>                      Path to the CLI configuration file
        --generate-static-view-configs         Generate static view configs for Fabric components. If there are no Fabric components in the bundle or Fabric is disabled, this is just no-op.
        --read-global-cache                    Try to fetch transformed JS code from the global cache, if configured.
        -h, --help                             Usage info
    "
  `);
});

it(
  'runs `npx expo export:embed`',
  async () => {
    const projectRoot = await setupTestProjectAsync('ios-export-embed', 'with-assets');
    fs.ensureDir(path.join(projectRoot, 'dist'));
    await execa(
      'node',
      [
        bin,
        'export:embed',
        '--entry-file',
        './App.js',
        '--bundle-output',
        './dist/output.js',
        '--assets-dest',
        'dist',
        '--platform',
        'ios',
      ],
      {
        cwd: projectRoot,
      }
    );

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

    // If this changes then everything else probably changed as well.
    expect(files).toEqual([
      'assets/assets/font.ttf',
      'assets/assets/icon.png',
      'assets/assets/icon@2x.png',
      'output.js',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
