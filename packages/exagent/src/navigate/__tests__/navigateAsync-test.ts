import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { navigateAsync } from '../navigateAsync';
import type { NavigateOptions } from '../resolveOptions';

const projectRoot = '/project';
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

interface SpawnAnswer {
  stdout?: string;
  exitCode?: number | null;
}

/** Answer each `spawn` call in order, and record the argv it was called with. */
function mockSpawnQueue(answers: SpawnAnswer[]) {
  let call = 0;
  jest.mocked(spawn).mockImplementation((() => {
    const answer = answers[call++] ?? {};
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    process.nextTick(() => {
      if (answer.stdout) {
        child.stdout.emit('data', answer.stdout);
      }
      child.emit('close', answer.exitCode ?? 0, null);
    });
    return child as any;
  }) as any);
}

function spawnedArgv(index: number): string[] {
  const [bin, args] = jest.mocked(spawn).mock.calls[index] as unknown as [string, string[]];
  return [bin, ...args];
}

const BOOTED_SIMULATOR = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
      { udid: 'IOS-1', name: 'iPhone 17', state: 'Booted' },
    ],
  },
});

const ADB_DEVICES = 'List of devices attached\nemulator-5554\tdevice\n';

const EXPO_GO_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
};

/** Answer `GET /json/list` with the given targets, or make the dev server unreachable. */
function mockDevServer(targets: unknown[] | null) {
  globalThis.fetch = (async () => {
    if (targets == null) {
      throw new Error('fetch failed');
    }
    return { ok: true, json: async () => targets };
  }) as unknown as typeof fetch;
}

function options(overrides: Partial<NavigateOptions> = {}): NavigateOptions {
  return { route: '/profile/42', devServerUrl: 'http://127.0.0.1:8081', ...overrides };
}

let originalFetch: typeof fetch | undefined;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  mockPlatform('darwin');
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
  mockPlatform(realPlatform);
  vol.reset();
});

describe(navigateAsync, () => {
  it(`should open the exp:// URL on the booted simulator when Expo Go is connected`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
    });
    mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: 'success' }]);

    await expect(navigateAsync(projectRoot, options())).resolves.toBe(0);

    expect(spawnedArgv(1)).toEqual([
      'xcrun',
      'simctl',
      'openurl',
      'IOS-1',
      'exp://127.0.0.1:8081/--/profile/42',
    ]);
  });

  it(`should open the project scheme on Android for a development build`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({
        name: 'demo',
        dependencies: { 'expo-dev-client': '5.0.0' },
      }),
      [`${projectRoot}/node_modules/expo-dev-client/package.json`]: '{"name":"expo-dev-client"}',
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
    });
    mockDevServer(null);
    mockSpawnQueue([{ stdout: ADB_DEVICES }, { stdout: 'Starting: Intent' }]);

    await expect(
      navigateAsync(projectRoot, options({ platform: 'android', appId: 'com.example.demo' }))
    ).resolves.toBe(0);

    const argv = spawnedArgv(1);
    expect(argv[0]).toBe('adb');
    expect(argv).toContain(`'demoapp://profile/42'`);
    expect(argv.at(-1)).toBe('com.example.demo');
  });

  it(`should prefer the scheme flag over the app connected to the dev server`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo' } }),
    });
    mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await expect(navigateAsync(projectRoot, options({ scheme: 'override' }))).resolves.toBe(0);

    expect(spawnedArgv(1).at(-1)).toBe('override://profile/42');
  });

  it(`should report a device that refused the deep link`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
    });
    mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '', exitCode: 1 }]);

    await expect(navigateAsync(projectRoot, options())).resolves.toBe(1);
    expect(jest.mocked(console.error).mock.calls.join('\n')).toContain(
      'did not open the deep link'
    );
  });

  it(`should explain an unresolvable scheme instead of opening anything`, async () => {
    vol.fromJSON({
      [`${projectRoot}/app.config.js`]: 'module.exports = {};',
      [`${projectRoot}/ios/Podfile`]: '',
    });
    mockDevServer(null);
    mockSpawnQueue([]);

    const error = await navigateAsync(projectRoot, options()).catch((e) => e);

    expect(error.code).toBe('DEEP_LINK_UNRESOLVED');
    expect(error.message).toContain('app.config.js');
    expect(spawn).not.toHaveBeenCalled();
  });

  it(`should explain a missing dev server when Expo Go needs its host`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo' } }),
    });
    mockDevServer(null);
    mockSpawnQueue([]);

    const error = await navigateAsync(projectRoot, options()).catch((e) => e);

    expect(error.code).toBe('DEEP_LINK_UNRESOLVED');
    expect(error.message).toContain('npx expo start');
  });
});
