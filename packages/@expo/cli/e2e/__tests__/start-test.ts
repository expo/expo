/* eslint-env jest */
import {
  isMultipartPartWithName,
  parseMultipartMixedResponseAsync,
} from '@expo/multipart-body-parser';
import execa from 'execa';
import fs from 'fs-extra';
import fetch from 'node-fetch';
import nullthrows from 'nullthrows';
import path from 'path';

import {
  execute,
  projectRoot,
  getLoadedModulesAsync,
  setupTestProjectAsync,
  bin,
  ensurePortFreeAsync,
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
    '../node_modules/ansi-styles/index.js',
    '../node_modules/arg/index.js',
    '../node_modules/chalk/source/index.js',
    '../node_modules/chalk/source/util.js',
    '../node_modules/has-flag/index.js',
    '../node_modules/supports-color/index.js',
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
        <dir>                                  Directory of the Expo project. Default: Current working directory
        -a, --android                          Open on a connected Android device
        -i, --ios                              Open in an iOS simulator
        -w, --web                              Open in a web browser
        
        -d, --dev-client                       Launch in a custom native app
        -g, --go                               Launch in Expo Go
        
        -c, --clear                            Clear the bundler cache
        --max-workers <number>                 Maximum number of tasks to allow Metro to spawn
        --no-dev                               Bundle in production mode
        --minify                               Minify JavaScript
        
        -m, --host <mode>                      Dev server hosting type. Default: lan
                                               lan: Use the local network
                                               tunnel: Use any network by tunnel through ngrok
                                               localhost: Connect to the dev server over localhost
        --tunnel                               Same as --host tunnel
        --lan                                  Same as --host lan
        --localhost                            Same as --host localhost
        
        --offline                              Skip network requests and use anonymous manifest signatures
        --https                                Start the dev server with https protocol
        --scheme <scheme>                      Custom URI protocol to use when launching an app
        -p, --port <number>                    Port to start the dev server on (does not apply to web or tunnel). Default: 19000
        
        --force-manifest-type <manifest-type>  Override auto detection of manifest type
        --private-key-path <path>              Path to private key for code signing. Default: "private-key.pem" in the same directory as the certificate specified by the expo-updates configuration in app.json.
        -h, --help                             Usage info
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
  const kill = () => ensurePortFreeAsync(19000);

  beforeEach(async () => {
    await kill();
  });

  afterAll(async () => {
    await kill();
  });
  it(
    'runs `npx expo start`',
    async () => {
      const projectRoot = await setupTestProjectAsync('basic-start', 'with-blank');
      await fs.remove(path.join(projectRoot, '.expo'));

      const promise = execa('node', [bin, 'start'], { cwd: projectRoot });

      console.log('Starting server');

      await new Promise<void>((resolve, reject) => {
        promise.on('close', (code: number) => {
          reject(
            code === 0
              ? 'Server closed too early. Run `kill -9 $(lsof -ti:19000)` to kill the orphaned process.'
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
      const response = await fetch('http://localhost:19000/', {
        headers: {
          'expo-platform': 'ios',
          Accept: 'multipart/mixed',
        },
      });

      const multipartParts = await parseMultipartMixedResponseAsync(
        response.headers.get('content-type') as string,
        await response.buffer()
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
        'http://127.0.0.1:19000/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false&lazy=true'
      );
      expect(manifest.extra.expoGo.debuggerHost).toBe('127.0.0.1:19000');
      expect(manifest.extra.expoGo.logUrl).toBe('http://127.0.0.1:19000/logs');
      expect(manifest.extra.expoGo.mainModuleName).toBe('node_modules/expo/AppEntry');
      expect(manifest.extra.expoClient.hostUri).toBe('127.0.0.1:19000');

      // Manifest
      expect(manifest.runtimeVersion).toBe('exposdk:47.0.0');
      expect(manifest.extra.expoClient.sdkVersion).toBe('47.0.0');
      expect(manifest.extra.expoClient.slug).toBe('basic-start');
      expect(manifest.extra.expoClient.name).toBe('basic-start');

      // Custom
      expect(manifest.extra.expoGo.__flipperHack).toBe('React Native packager is running');

      console.log('Fetching bundle');
      const bundle = await fetch(manifest.launchAsset.url).then((res) => res.text());
      console.log('Fetched bundle: ', bundle.length);
      expect(bundle.length).toBeGreaterThan(1000);
      console.log('Finished');

      // Kill process.
      promise.kill('SIGTERM');

      await promise;
    },
    // Could take 45s depending on how fast npm installs
    120 * 1000
  );
});
