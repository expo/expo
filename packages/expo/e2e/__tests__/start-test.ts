/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';

import { bin, execute, getLoadedModulesAsync, projectRoot } from './utils';

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
  const modules = await getLoadedModulesAsync(`require('../../build-cli/cli/start').expoStart`);
  expect(modules).toStrictEqual([
    'node_modules/ansi-styles/index.js',
    'node_modules/arg/index.js',
    'node_modules/chalk/source/index.js',
    'node_modules/chalk/source/util.js',
    'node_modules/has-flag/index.js',
    'node_modules/supports-color/index.js',
    'packages/expo/build-cli/cli/log.js',
    'packages/expo/build-cli/cli/start/index.js',
    'packages/expo/build-cli/cli/utils/args.js',
    'packages/expo/build-cli/cli/utils/errors.js',
  ]);
});

it('runs `npx expo start --help`', async () => {
  const results = await execute('start', '--help');
  expect(results.stdout).toMatchInlineSnapshot(`
    "
      Description
        Start a local dev server for the app

      Usage
        $ npx expo start <dir>

      <dir> is the directory of the Expo project.
      Defaults to the current working directory.

      Options
        -a, --android                          Opens your app in Expo Go on a connected Android device
        -i, --ios                              Opens your app in Expo Go in a currently running iOS simulator on your computer
        -w, --web                              Opens your app in a web browser

        -c, --clear                            Clear the bundler cache
        --max-workers <num>                    Maximum number of tasks to allow Metro to spawn
        --no-dev                               Bundle in production mode
        --minify                               Minify JavaScript    

        -m, --host <mode>                      lan, tunnel, localhost. Dev server hosting type. Default: lan.
                                               - lan: Use the local network
                                               - tunnel: Use any network by tunnel through ngrok
                                               - localhost: Connect to the dev server over localhost
        --tunnel                               Same as --host tunnel
        --lan                                  Same as --host lan
        --localhost                            Same as --host localhost

        --offline                              Skip network requests and use anonymous manifest signatures
        --https                                Start the dev server with https protocol
        --scheme <scheme>                      Custom URI protocol to use when launching an app
        -p, --port <port>                      Port to start the dev server on (does not apply to web or tunnel). Default: 19000

        --dev-client                           Experimental: Starts the bundler for use with the expo-development-client
        --force-manifest-type <manifest-type>  Override auto detection of manifest type
        -h, --help                             output usage information
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
