/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import { projectRoot, getLoadedModulesAsync, setupTestProjectWithOptionsAsync } from './utils';
import { createExpoStart, executeExpoAsync } from '../utils/expo';

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
  const modules = await getLoadedModulesAsync(`require('../../build/src/start').expoStart`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/start/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo start --help`', async () => {
  const results = await executeExpoAsync(projectRoot, ['start', '--help']);
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Info
        Start a local dev server for the app

      Usage
        $ npx expo start <dir>

      Options
        <dir>                           Directory of the Expo project. Default: Current working directory
        -a, --android                   Open on a connected Android device
        -i, --ios                       Open in an iOS simulator
        -w, --web                       Open in a web browser
        
        -d, --dev-client                Launch in a custom native app
        -g, --go                        Launch in Expo Go
        
        -c, --clear                     Clear the bundler cache
        --max-workers <number>          Maximum number of tasks to allow Metro to spawn
        --no-dev                        Bundle in production mode
        --minify                        Minify JavaScript
        
        -m, --host <string>             Dev server hosting type. Default: lan
                                        lan: Use the local network
                                        tunnel: Use any network by tunnel through ngrok
                                        localhost: Connect to the dev server over localhost
        --tunnel                        Same as --host tunnel
        --lan                           Same as --host lan
        --localhost                     Same as --host localhost
        
        --offline                       Skip network requests and use anonymous manifest signatures
        --https                         Start the dev server with https protocol
        --scheme <scheme>               Custom URI protocol to use when launching an app
        -p, --port <number>             Port to start the dev server on (does not apply to web or tunnel). Default: 8081
        
        --private-key-path <path>       Path to private key for code signing. Default: "private-key.pem" in the same directory as the certificate specified by the expo-updates configuration in app.json.
        -h, --help                      Usage info
    "
  `);
});

for (const args of [
  ['--lan', '--tunnel'],
  ['--offline', '--localhost'],
  ['--host', 'localhost', '--tunnel'],
  ['-m', 'localhost', '--lan', '--offline'],
]) {
  it(`asserts invalid URL arguments on \`expo start ${args.join(' ')}\``, async () => {
    await expect(
      executeExpoAsync(projectRoot, ['start', ...args], { verbose: false })
    ).rejects.toThrow(/Specify at most one of/);
  });
}

describe('server', () => {
  const expo = createExpoStart({
    env: {
      EXPO_USE_FAST_RESOLVER: 'true',
    },
  });

  beforeEach(async () => {
    expo.options.cwd = await setupTestProjectWithOptionsAsync('basic-start', 'with-blank');
    await fs.promises.rm(path.join(projectRoot, '.expo'), { force: true, recursive: true });
    await expo.startAsync();
  });
  afterAll(async () => {
    await expo.stopAsync();
  });

  it('runs `npx expo start`', async () => {
    const manifest = await expo.fetchExpoGoManifestAsync();

    // Required for Expo Go
    expect(manifest.extra.expoGo?.packagerOpts).toStrictEqual({
      dev: true,
    });
    expect(manifest.extra.expoGo?.developer).toStrictEqual({
      projectRoot: expect.anything(),
      tool: 'expo-cli',
    });

    // URLs
    expect(manifest.launchAsset.url).toBe(
      new URL(
        '/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable',
        expo.url
      ).href
    );
    expect(manifest.extra.expoGo?.debuggerHost).toBe(expo.url.host);
    expect(manifest.extra.expoGo?.mainModuleName).toMatchPath('node_modules/expo/AppEntry');
    expect(manifest.extra.expoClient?.hostUri).toBe(expo.url.host);

    // Manifest
    expect(manifest.runtimeVersion).toBe('1.0');
    expect(manifest.extra.expoClient?.sdkVersion).toBe('52.0.0');
    expect(manifest.extra.expoClient?.slug).toBe('basic-start');
    expect(manifest.extra.expoClient?.name).toBe('basic-start');

    // Custom
    expect(manifest.extra.expoGo?.__flipperHack).toBe('React Native packager is running');

    const bundleResponse = await expo.fetchBundleAsync(manifest.launchAsset.url);
    const bundleContent = await bundleResponse.text();
    expect(bundleContent.length).toBeGreaterThan(1000);

    // Get source maps for the bundle
    // Find source map URL
    const sourceMapUrl = bundleContent.match(/\/\/# sourceMappingURL=(.*)/)?.[1];
    expect(sourceMapUrl).toBeTruthy();

    const sourceMaps = await expo.fetchBundleAsync(sourceMapUrl!).then((res) => res.json());
    expect(sourceMaps).toMatchObject({
      version: 3,
      sources: expect.arrayContaining([
        '__prelude__',
        expect.pathMatching(/metro-runtime\/src\/polyfills\/require\.js$/),
        expect.pathMatching(/@react-native\/js-polyfills\/console\.js$/),
        expect.pathMatching(/@react-native\/js-polyfills\/error-guard\.js$/),
        '\0polyfill:external-require',
        // Ensure that the custom module from the serializer is included in dev, otherwise the sources will be thrown off.
        '\0polyfill:environment-variables',
      ]),
      mappings: expect.any(String),
    });
  });
});

describe('start - dev clients', () => {
  const expo = createExpoStart({
    env: {
      EXPO_USE_FAST_RESOLVER: 'true',
    },
  });

  beforeAll(async () => {
    const projectRoot = await setupTestProjectWithOptionsAsync('start-dev-clients', 'with-blank');
    expo.options.cwd = projectRoot;

    // Add a `.env` file with `TEST_SCHEME`
    await fs.promises.writeFile(path.join(projectRoot, '.env'), `TEST_SCHEME=some-value`);
    // Add a `app.config.js` that asserts an env var from .env
    await fs.promises.writeFile(
      path.join(projectRoot, 'app.config.js'),
      `const assert = require('node:assert');
      const { env } = require('node:process');
  
      module.exports = ({ config }) => {
        assert(env.TEST_SCHEME, 'TEST_SCHEME is not defined');
        return { ...config, scheme: env.TEST_ENV };
      };`
    );

    await expo.startAsync(['--dev-client']);
  });
  afterAll(async () => {
    await expo.stopAsync();
  });

  it('runs `npx expo start` in dev client mode, using environment variable from .env', async () => {
    const response = await expo.fetchBundleAsync('/');
    expect(response.ok).toBeTruthy();
  });
});
