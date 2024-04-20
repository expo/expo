/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { execute, projectRoot, getLoadedModulesAsync, bin } from './utils';

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
  const modules = await getLoadedModulesAsync(
    `require('../../build/src/export/embed').expoExportEmbed`
  );
  expect(modules).toStrictEqual([
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
        --asset-catalog-dest <string>          Directory to create an iOS Asset Catalog for images
        --unstable-transform-profile <string>  Experimental, transform JS for a specific JS engine. Currently supported: hermes, hermes-canary, default
        --reset-cache                          Removes cached files
        -v, --verbose                          Enables debug logging
        --config <string>                      Path to the CLI configuration file
        --read-global-cache                    Try to fetch transformed JS code from the global cache, if configured.
        -h, --help                             Usage info
    "
  `);
});

function ensureTesterReady(fixtureName: string): string {
  const root = path.join(__dirname, '../../../../../apps/router-e2e');
  // Clear metro cache for the env var to be updated
  // await fs.remove(path.join(root, "node_modules/.cache/metro"));

  // @ts-ignore
  process.env.E2E_ROUTER_SRC = fixtureName;

  return root;
}

it(
  'runs `npx expo export:embed`',
  async () => {
    const projectRoot = ensureTesterReady('static-rendering');
    const output = 'dist-export-embed';
    await fs.remove(path.join(projectRoot, output));
    await fs.ensureDir(path.join(projectRoot, output));

    await execa(
      'node',
      [
        bin,
        'export:embed',
        '--entry-file',
        path.join(projectRoot, './index.js'),
        '--bundle-output',
        `./${output}/output.js`,
        '--assets-dest',
        output,
        '--platform',
        'ios',
        '--dev',
        'false',
      ],
      {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'development',
        },
      }
    );

    const outputDir = path.join(projectRoot, 'dist-export-embed');
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
      'assets/__e2e__/static-rendering/sweet.ttf',
      'assets/__packages/expo-router/assets/error.png',
      'assets/__packages/expo-router/assets/file.png',
      'assets/__packages/expo-router/assets/forward.png',
      'assets/__packages/expo-router/assets/pkg.png',
      'assets/assets/icon.png',
      'output.js',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);

it(
  'runs `npx expo export:embed` with source maps',
  async () => {
    const projectRoot = ensureTesterReady('static-rendering');
    const output = 'dist-export-embed-source-maps';
    await fs.remove(path.join(projectRoot, output));
    await fs.ensureDir(path.join(projectRoot, output));

    await execa(
      'node',
      [
        bin,
        'export:embed',
        '--entry-file',
        path.join(projectRoot, './index.js'),
        '--bundle-output',
        `./${output}/output.js`,
        '--assets-dest',
        output,
        '--platform',
        'ios',
        '--dev',
        'false',
        '--sourcemap-output',
        `./${output}/output.js.map`,
        '--sourcemap-sources-root',
        projectRoot,
      ],
      {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'development',
        },
      }
    );

    const outputDir = path.join(projectRoot, output);
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
      'assets/__e2e__/static-rendering/sweet.ttf',
      'assets/__packages/expo-router/assets/error.png',
      'assets/__packages/expo-router/assets/file.png',
      'assets/__packages/expo-router/assets/forward.png',
      'assets/__packages/expo-router/assets/pkg.png',
      'assets/assets/icon.png',
      'output.js',
      'output.js.map',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
