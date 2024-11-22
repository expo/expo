/* eslint-env jest */
import {
  isMultipartPartWithName,
  parseMultipartMixedResponseAsync,
} from '@expo/multipart-body-parser';
import execa from 'execa';
import fs from 'fs-extra';
import nullthrows from 'nullthrows';
import path from 'path';

import {
  execute,
  projectRoot,
  getLoadedModulesAsync,
  bin,
  ensurePortFreeAsync,
  setupTestProjectWithOptionsAsync,
} from './utils';

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
  const modules = await getLoadedModulesAsync(`require('../../build/src/start').expoStart`);
  expect(modules).toStrictEqual([
    '@expo/cli/build/src/log.js',
    '@expo/cli/build/src/start/index.js',
    '@expo/cli/build/src/utils/args.js',
    '@expo/cli/build/src/utils/errors.js',
  ]);
});

it('runs `npx expo start --help`', async () => {
  const results = await execute('start', '--help');
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
    await expect(execa('node', [bin, 'start', ...args], { cwd: projectRoot })).rejects.toThrowError(
      /Specify at most one of/
    );
  });
}

describe('server', () => {
  // Kill port
  const kill = () => ensurePortFreeAsync(8081);

  beforeEach(async () => {
    await kill();
  });

  afterAll(async () => {
    await kill();
  });
  it(
    'runs `npx expo start`',
    async () => {
      const projectRoot = await setupTestProjectWithOptionsAsync('basic-start', 'with-blank');

      await fs.remove(path.join(projectRoot, '.expo'));

      const promise = execa('node', [bin, 'start'], {
        cwd: projectRoot,
        env: {
          ...process.env,
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      });

      console.log('Starting server');

      await new Promise<void>((resolve, reject) => {
        promise.on('close', (code: number) => {
          reject(
            code === 0
              ? 'Server closed too early. Run `kill -9 $(lsof -ti:8081)` to kill the orphaned process.'
              : code
          );
        });

        promise.stdout?.on('data', (data) => {
          const stdout = data.toString();
          console.log('output:', stdout);
          if (stdout.includes('Logs for your project')) {
            resolve();
          }
        });
      });

      console.log('Fetching manifest');
      const response = await fetch('http://localhost:8081/', {
        headers: {
          'expo-platform': 'ios',
          Accept: 'multipart/mixed',
        },
      });

      const multipartParts = await parseMultipartMixedResponseAsync(
        response.headers.get('content-type') as string,
        Buffer.from(await response.arrayBuffer())
      );
      const manifestPart = nullthrows(
        multipartParts.find((part) => isMultipartPartWithName(part, 'manifest'))
      );

      const manifest = JSON.parse(manifestPart.body);

      // Required for Expo Go
      expect(manifest.extra.expoGo.packagerOpts).toStrictEqual({
        dev: true,
      });
      expect(manifest.extra.expoGo.developer).toStrictEqual({
        projectRoot: expect.anything(),
        tool: 'expo-cli',
      });

      // URLs
      expect(manifest.launchAsset.url).toBe(
        'http://127.0.0.1:8081/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&transform.engine=hermes&transform.bytecode=1&transform.routerRoot=app&unstable_transformProfile=hermes-stable'
      );
      expect(manifest.extra.expoGo.debuggerHost).toBe('127.0.0.1:8081');
      expect(manifest.extra.expoGo.mainModuleName).toBe('node_modules/expo/AppEntry');
      expect(manifest.extra.expoClient.hostUri).toBe('127.0.0.1:8081');

      // Manifest
      expect(manifest.runtimeVersion).toBe('1.0');
      expect(manifest.extra.expoClient.sdkVersion).toBe('52.0.0');
      expect(manifest.extra.expoClient.slug).toBe('basic-start');
      expect(manifest.extra.expoClient.name).toBe('basic-start');

      // Custom
      expect(manifest.extra.expoGo.__flipperHack).toBe('React Native packager is running');

      console.log('Fetching bundle');
      const bundleRequest = await fetch(manifest.launchAsset.url);
      if (!bundleRequest.ok) {
        console.error(await bundleRequest.text());
        throw new Error('Failed to fetch bundle');
      }
      const bundle = await bundleRequest.text();
      console.log('Fetched bundle: ', bundle.length);
      expect(bundle.length).toBeGreaterThan(1000);
      console.log('Finished');

      // Get source maps for the bundle
      // Find source map URL
      const sourceMapUrl = bundle.match(/\/\/# sourceMappingURL=(.*)/)?.[1];
      expect(sourceMapUrl).toBeTruthy();

      const sourceMaps = await fetch(sourceMapUrl!).then((res) => res.json());
      expect(sourceMaps).toMatchObject({
        version: 3,
        sources: expect.arrayContaining([
          '__prelude__',
          expect.stringContaining('metro-runtime/src/polyfills/require.js'),
          expect.stringContaining('@react-native/js-polyfills/console.js'),
          expect.stringContaining('@react-native/js-polyfills/error-guard.js'),
          '\0polyfill:external-require',
          // Ensure that the custom module from the serializer is included in dev, otherwise the sources will be thrown off.
          '\0polyfill:environment-variables',
        ]),
        mappings: expect.any(String),
      });

      // Kill process.
      promise.kill('SIGTERM');

      await promise;
    },
    // Could take 45s depending on how fast npm installs
    120 * 1000
  );
});
