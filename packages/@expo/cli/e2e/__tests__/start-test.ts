/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';
import fetch from 'node-fetch';
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
        -a, --android                          Opens your app in Expo Go on a connected Android device
        -i, --ios                              Opens your app in Expo Go in a currently running iOS simulator on your computer
        -w, --web                              Opens your app in a web browser
        
        -c, --clear                            Clear the bundler cache
        --max-workers <num>                    Maximum number of tasks to allow Metro to spawn
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
        -p, --port <port>                      Port to start the dev server on (does not apply to web or tunnel). Default: 19000
        
        --dev-client                           Experimental: Starts the bundler for use with the expo-development-client
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
      const results = await fetch('http://localhost:19000/', {
        headers: {
          'expo-platform': 'ios',
        },
      }).then((res) => res.json());

      // Required for Expo Go
      expect(results.packagerOpts).toStrictEqual({
        dev: true,
      });
      expect(results.developer).toStrictEqual({
        projectRoot: expect.anything(),
        tool: 'expo-cli',
      });

      // URLs
      expect(results.bundleUrl).toBe(
        'http://127.0.0.1:19000/node_modules/expo/AppEntry.bundle?platform=ios&dev=true&hot=false'
      );
      expect(results.debuggerHost).toBe('127.0.0.1:19000');
      expect(results.hostUri).toBe('127.0.0.1:19000');
      expect(results.logUrl).toBe('http://127.0.0.1:19000/logs');
      expect(results.mainModuleName).toBe('node_modules/expo/AppEntry');

      // Manifest
      expect(results.sdkVersion).toBe('47.0.0');
      expect(results.slug).toBe('basic-start');
      expect(results.name).toBe('basic-start');

      // Custom
      expect(results.__flipperHack).toBe('React Native packager is running');

      console.log('Fetching bundle');
      const bundle = await fetch(results.bundleUrl).then((res) => res.text());
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
