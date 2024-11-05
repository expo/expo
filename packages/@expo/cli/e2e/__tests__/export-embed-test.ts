/* eslint-env jest */
import { resolveRelativeEntryPoint } from '@expo/config/paths';
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { execute, projectRoot, getLoadedModulesAsync, bin } from './utils';

const originalForceColor = process.env.FORCE_COLOR;
const originalCI = process.env.CI;

jest.unmock('resolve-from');

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
        --eager                                Eagerly export the bundle with default options
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
        resolveRelativeEntryPoint(projectRoot, { platform: 'ios' }),
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
          E2E_ROUTER_JS_ENGINE: 'hermes',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
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
      'assets/__packages/expo-router/assets/sitemap.png',
      'assets/assets/icon.png',
      'output.js',
    ]);

    // Ensure output.js is a utf8 encoded file
    const outputJS = fs.readFileSync(path.join(outputDir, 'output.js'), 'utf8');
    expect(outputJS.slice(0, 5)).toBe('var _');

    // Ensure no `//# sourceURL=` comment
    expect(outputJS).not.toContain('//# sourceURL=');
    // Ensure `//# sourceMappingURL=output.js.map`
    expect(outputJS).not.toContain('//# sourceMappingURL=');
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);

it(
  'runs `npx expo export:embed --platform ios` with source maps',
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
        resolveRelativeEntryPoint(projectRoot, { platform: 'ios' }),
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
          EXPO_USE_FAST_RESOLVER: '1',
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

    // Ensure output.js is a utf8 encoded file
    const outputJS = fs.readFileSync(path.join(outputDir, 'output.js'), 'utf8');
    expect(outputJS.slice(0, 5)).toBe('var _');
    // Ensure no `//# sourceURL=` comment
    expect(outputJS).not.toContain('//# sourceURL=');
    // Ensure `//# sourceMappingURL=output.js.map`
    expect(outputJS).toContain('//# sourceMappingURL=output.js.map');

    // If this changes then everything else probably changed as well.
    expect(files).toEqual([
      'assets/__e2e__/static-rendering/sweet.ttf',
      'assets/__packages/expo-router/assets/error.png',
      'assets/__packages/expo-router/assets/file.png',
      'assets/__packages/expo-router/assets/forward.png',
      'assets/__packages/expo-router/assets/pkg.png',
      'assets/__packages/expo-router/assets/sitemap.png',
      'assets/assets/icon.png',
      'output.js',
      'output.js.map',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);

it(
  'runs `npx expo export:embed --platform ios` with a robot user',
  async () => {
    const projectRoot = ensureTesterReady('react-native-canary');
    const output = 'dist-export-embed-robot-user';
    await fs.remove(path.join(projectRoot, output));
    await fs.ensureDir(path.join(projectRoot, output));

    await execa(
      'node',
      [
        bin,
        'export:embed',
        '--entry-file',
        resolveRelativeEntryPoint(projectRoot, { platform: 'ios' }),
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
          E2E_ROUTER_SRC: 'react-native-canary',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: '1',

          // Most important part:
          // NOTE(EvanBacon): This is a robot user token for an expo-managed account that can authenticate with view-only permission.
          // The token is not secret and can be used to authenticate with the Expo API.
          EXPO_TOKEN: '4awlFlcNYg7qOFa8J3a7d5Uaph8FaTsD1SP2xWEf',

          // Ensure EXPO_OFFLINE is not set!
          // EXPO_OFFLINE
        },
        // stdio: 'inherit',
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

    // Ensure output.js is a utf8 encoded file
    const outputJS = fs.readFileSync(path.join(outputDir, 'output.js'), 'utf8');
    expect(outputJS.slice(0, 5)).toBe('var _');

    // If this changes then everything else probably changed as well.
    expect(files).toEqual([
      'assets/__packages/expo-router/assets/error.png',
      'assets/__packages/expo-router/assets/file.png',
      'assets/__packages/expo-router/assets/forward.png',
      'assets/__packages/expo-router/assets/pkg.png',
      'assets/__packages/expo-router/assets/sitemap.png',
      'output.js',
    ]);
  },
  120 * 1000
);

it(
  'runs `npx expo export:embed --platform android` with source maps',
  async () => {
    const projectRoot = ensureTesterReady('static-rendering');
    const output = 'dist-export-embed-source-maps-android';
    await fs.remove(path.join(projectRoot, output));
    await fs.ensureDir(path.join(projectRoot, output));

    console.log(
      [
        'export:embed',
        '--entry-file',
        resolveRelativeEntryPoint(projectRoot, { platform: 'android' }),
        '--bundle-output',
        `./${output}/output.js`,
        '--assets-dest',
        output,
        '--platform',
        'android',
        '--dev',
        'false',
        '--sourcemap-output',
        path.join(projectRoot, `./${output}/output.js.map`),
        '--sourcemap-sources-root',
        projectRoot,
      ].join(' ')
    );

    const res = await execa(
      'node',

      // yarn expo export:embed --platform android --dev false --reset-cache --entry-file /Users/cedric/Desktop/test-expo-29656/node_modules/expo/AppEntry.js --bundle-output /Users/cedric/Desktop/test-expo-29656/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle --assets-dest /Users/cedric/Desktop/test-expo-29656/android/app/build/generated/res/createBundleReleaseJsAndAssets
      // --sourcemap-output /Users/cedric/Desktop/test-expo-29656/android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map --minify false
      [
        bin,
        'export:embed',
        '--entry-file',
        resolveRelativeEntryPoint(projectRoot, { platform: 'android' }),
        '--bundle-output',
        `./${output}/output.js`,
        '--assets-dest',
        output,
        '--platform',
        'android',
        '--dev',
        'false',
        '--sourcemap-output',
        path.join(projectRoot, `./${output}/output.js.map`),
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
          EXPO_USE_FAST_RESOLVER: '1',
        },
      }
    );

    // Ensure no unexpected errors/warnings are thrown.
    expect(res.stderr).toBe('Experimental module resolution is enabled.');

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

    // Ensure output.js is a utf8 encoded file
    const outputJS = fs.readFileSync(path.join(outputDir, 'output.js'), 'utf8');
    expect(outputJS.slice(0, 5)).toBe('var _');
    // Ensure no `//# sourceURL=` comment
    expect(outputJS).not.toContain('//# sourceURL=');
    // Ensure `//# sourceMappingURL=output.js.map`
    expect(outputJS).toContain('//# sourceMappingURL=output.js.map');

    // If this changes then everything else probably changed as well.
    expect(files).toEqual([
      'drawable-mdpi/__packages_exporouter_assets_error.png',
      'drawable-mdpi/__packages_exporouter_assets_file.png',
      'drawable-mdpi/__packages_exporouter_assets_forward.png',
      'drawable-mdpi/__packages_exporouter_assets_pkg.png',
      'drawable-mdpi/__packages_exporouter_assets_sitemap.png',
      'drawable-mdpi/assets_icon.png',
      'output.js',
      'output.js.map',
      'raw/__e2e___staticrendering_sweet.ttf',
    ]);
  },
  // Could take 45s depending on how fast npm installs
  120 * 1000
);
