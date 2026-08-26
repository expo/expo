import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { readDevServerLockAsync, readLastLoggedDevServerPort } from '../../devLock';
import { navigateAsync } from '../navigateAsync';
import type { NavigateOptions } from '../resolveOptions';

jest.mock('../../devLock', () => ({
  readDevServerLockAsync: jest.fn(async () => null),
  readLastLoggedDevServerPort: jest.fn(() => null),
}));

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

/**
 * Answer only for the origins in the map, and refuse every other one.
 *
 * What discovery needs to be tested against: a machine where one port answers and the rest do not
 * is the whole reason the lock exists.
 */
function mockDevServersAt(byOrigin: { [origin: string]: unknown[] }) {
  globalThis.fetch = (async (input: string) => {
    const origin = new URL(String(input)).origin;
    const targets = byOrigin[origin];
    if (targets == null) {
      throw new Error(`connect ECONNREFUSED ${origin}`);
    }
    return { ok: true, json: async () => targets };
  }) as unknown as typeof fetch;
}

function options(overrides: Partial<NavigateOptions> = {}): NavigateOptions {
  return {
    route: '/profile/42',
    devServerUrl: 'http://127.0.0.1:8081',
    printUrl: false,
    json: false,
    followups: true,
    routeCheck: true,
    ...overrides,
  };
}

/** Everything the command wrote to stdout, joined into one string. */
function printed(): string {
  return jest.mocked(console.log).mock.calls.flat().join('\n');
}

let originalFetch: typeof fetch | undefined;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  // `clearMocks` empties these between tests, and "no lock, no logged port" is the default state.
  jest.mocked(readDevServerLockAsync).mockResolvedValue(null);
  jest.mocked(readLastLoggedDevServerPort).mockReturnValue(null);
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

  // The bug this pins: `navigate` was the one runtime-facing command that assumed 8081, so on a
  // machine where another project held that port it opened *that* project on the simulator and
  // reported success. Every sibling command already read the lock.
  describe('dev-server discovery', () => {
    function mockExpoGoProject() {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
      });
    }

    it(`should build the URL from the project's lock, not from 8081`, async () => {
      mockExpoGoProject();
      jest.mocked(readDevServerLockAsync).mockResolvedValue({
        url: 'http://127.0.0.1:8099',
        port: 8099,
        pid: 4242,
        startedAt: '2026-08-23T00:00:00.000Z',
        projectRoot,
      });
      // Both ports answer, and 8081 is another project's: the lock is what tells them apart.
      mockDevServersAt({
        'http://127.0.0.1:8099': [EXPO_GO_TARGET],
        'http://127.0.0.1:8081': [EXPO_GO_TARGET],
      });
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await expect(
        navigateAsync(projectRoot, options({ devServerUrl: null, json: true }))
      ).resolves.toBe(0);

      const report = JSON.parse(printed());
      expect(report.url).toBe('exp://127.0.0.1:8099/--/profile/42');
      expect(report.devServerUrl).toBe('http://127.0.0.1:8099');
      expect(report.devServerSource).toBe('lock');
      expect(spawnedArgv(1).at(-1)).toBe('exp://127.0.0.1:8099/--/profile/42');
    });

    it(`should still let --dev-server-url name the dev server exactly`, async () => {
      mockExpoGoProject();
      jest.mocked(readDevServerLockAsync).mockResolvedValue({
        url: 'http://127.0.0.1:8099',
        port: 8099,
        pid: 4242,
        startedAt: '2026-08-23T00:00:00.000Z',
        projectRoot,
      });
      mockDevServersAt({ 'http://127.0.0.1:8123': [EXPO_GO_TARGET] });
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await navigateAsync(
        projectRoot,
        options({ devServerUrl: 'http://127.0.0.1:8123', json: true })
      );

      const report = JSON.parse(printed());
      expect(report.devServerUrl).toBe('http://127.0.0.1:8123');
      expect(report.devServerSource).toBe('flag');
      expect(readDevServerLockAsync).not.toHaveBeenCalled();
    });

    // F26: the flag was the one dev-server source whose probe failure was not acted on, so a typo
    // in it deep-linked the device into an app with nothing to bundle for it, and reported exit 0.
    it(`should refuse to open anything when --dev-server-url does not answer`, async () => {
      mockExpoGoProject();
      mockDevServersAt({});
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      const error = await navigateAsync(
        projectRoot,
        options({ devServerUrl: 'http://127.0.0.1:8199' })
      ).catch((e) => e);

      expect(error.code).toBe('DEEP_LINK_UNRESOLVED');
      expect(error.message).toContain('http://127.0.0.1:8199');
      expect(error.message).toContain('--dev-server-url');
      expect(spawn).not.toHaveBeenCalled();
    });

    // The same dead URL against a development build: the scheme alone would have built a URL, which
    // is exactly why the probe has to be the thing that stops it.
    it(`should refuse a dead --dev-server-url even when the scheme needs no dev server`, async () => {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({
          name: 'demo',
          dependencies: { 'expo-dev-client': '5.0.0' },
        }),
        [`${projectRoot}/node_modules/expo-dev-client/package.json`]: '{"name":"expo-dev-client"}',
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
      });
      mockDevServersAt({});

      const error = await navigateAsync(
        projectRoot,
        options({ devServerUrl: 'http://127.0.0.1:8199' })
      ).catch((e) => e);

      expect(error.code).toBe('DEEP_LINK_UNRESOLVED');
      expect(spawn).not.toHaveBeenCalled();
    });

    // A development build with a known scheme needs no dev server, and discovery finding none must
    // not turn that into a failure.
    it(`should still resolve a scheme URL when nothing answers anywhere`, async () => {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({
          name: 'demo',
          dependencies: { 'expo-dev-client': '5.0.0' },
        }),
        [`${projectRoot}/node_modules/expo-dev-client/package.json`]: '{"name":"expo-dev-client"}',
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
      });
      mockDevServersAt({});
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await expect(
        navigateAsync(projectRoot, options({ devServerUrl: null, json: true }))
      ).resolves.toBe(0);

      expect(JSON.parse(printed()).url).toBe('demoapp://profile/42');
    });
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
      navigateAsync(
        projectRoot,
        // Nobody named a dev server: this is a development build with a scheme, which needs none.
        options({ devServerUrl: null, platform: 'android', appId: 'com.example.demo' })
      )
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

  it(`should print one JSON object and nothing else with --json`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
    });
    mockDevServer([EXPO_GO_TARGET]);
    // The device tool prints on success, which must not join the JSON on stdout.
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: 'success' }]);

    await expect(navigateAsync(projectRoot, options({ json: true }))).resolves.toBe(0);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(printed())).toEqual({
      route: '/profile/42',
      url: 'exp://127.0.0.1:8081/--/profile/42',
      devServerUrl: 'http://127.0.0.1:8081',
      devServerSource: 'flag',
      resolution: expect.stringContaining('Expo Go'),
      target: expect.stringContaining('Expo Go'),
      hostType: 'localhost',
      printUrl: false,
      platform: 'ios',
      deviceId: 'IOS-1',
      appId: null,
      command: 'xcrun simctl openurl IOS-1 exp://127.0.0.1:8081/--/profile/42',
      exitCode: 0,
      routeCheck: {
        checked: false,
        ok: null,
        matched: null,
        routeCount: 0,
        reason: 'this project has no app directory, so it does not use Expo Router',
      },
      followups: [
        {
          id: 'screenshot',
          command: 'xcrun simctl io IOS-1 screenshot screen.png',
          why: expect.any(String),
        },
        {
          id: 'runtime-errors',
          command: 'npx exagent runtime:errors',
          why: expect.any(String),
        },
      ],
    });
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  it(`should print a stable set of top-level keys with --json`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
    });
    mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await navigateAsync(projectRoot, options({ json: true }));

    expect(Object.keys(JSON.parse(printed())).sort()).toEqual([
      'appId',
      'command',
      'devServerSource',
      'devServerUrl',
      'deviceId',
      'exitCode',
      'followups',
      'hostType',
      'platform',
      'printUrl',
      'resolution',
      'route',
      'routeCheck',
      'target',
      'url',
    ]);
  });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — `navigate`.
  describe('follow-ups', () => {
    /** A project whose route resolves through Expo Go on a booted simulator. */
    function mockExpoGoProject() {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
      });
      mockDevServer([EXPO_GO_TARGET]);
    }

    it(`should offer the simulator screenshot and the runtime loop`, async () => {
      mockExpoGoProject();
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await navigateAsync(projectRoot, options());

      expect(printed()).toContain('Suggested next:');
      expect(printed()).toContain('xcrun simctl io IOS-1 screenshot screen.png');
      expect(printed()).toContain('npx exagent runtime:errors');
    });

    it(`should offer the adb screenshot for an Android device`, async () => {
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

      await navigateAsync(projectRoot, options({ devServerUrl: null, platform: 'android' }));

      expect(printed()).toContain('adb -s emulator-5554 exec-out screencap -p > screen.png');
    });

    it(`should print nothing with --no-followups`, async () => {
      mockExpoGoProject();
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await navigateAsync(projectRoot, options({ followups: false }));

      expect(printed()).not.toContain('Suggested next:');
    });

    it(`should offer nothing after a link the device refused`, async () => {
      mockExpoGoProject();
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '', exitCode: 1 }]);

      await expect(navigateAsync(projectRoot, options({ json: true }))).resolves.toBe(1);

      // There is no screen to capture, and the failure's own how/why is the next step.
      expect(JSON.parse(printed()).followups).toEqual([]);
    });
  });

  it(`should report a refused deep link on stderr and keep stdout to the JSON object`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
      [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
    });
    mockDevServer([EXPO_GO_TARGET]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '', exitCode: 1 }]);

    await expect(navigateAsync(projectRoot, options({ json: true }))).resolves.toBe(1);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(printed()).exitCode).toBe(1);
    // The what/why/how of a failure stays human text, on stderr.
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

    const error = await navigateAsync(projectRoot, options({ devServerUrl: null })).catch((e) => e);

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

    const error = await navigateAsync(projectRoot, options({ devServerUrl: null })).catch((e) => e);

    expect(error.code).toBe('DEEP_LINK_UNRESOLVED');
    expect(error.message).toContain('npx exagent dev --detach');
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route. The friction this pins:
  // `navigate /totally-bogus` exited 0 with the simulator on the "Unmatched Route" screen, and no
  // other gate could see it — the router renders that screen on purpose, so nothing is thrown.
  describe('route check', () => {
    function mockRouterProject(routeFiles: string[]) {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
        ...Object.fromEntries(routeFiles.map((file) => [`${projectRoot}/app/${file}`, ''])),
      });
    }

    it(`should refuse a route the project has not got, before touching a device`, async () => {
      mockRouterProject(['index.tsx', 'notes.tsx']);
      mockDevServer([EXPO_GO_TARGET]);
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      const error = await navigateAsync(projectRoot, options({ route: '/nope' })).catch((e) => e);

      expect(error.code).toBe('ROUTE_NOT_FOUND');
      expect(spawn).not.toHaveBeenCalled();
    });

    it(`should list the routes the project does have`, async () => {
      mockRouterProject(['index.tsx', 'notes.tsx', 'explore.tsx']);
      mockDevServer([EXPO_GO_TARGET]);

      const error = await navigateAsync(projectRoot, options({ route: '/nope' })).catch((e) => e);

      expect(error.message).toContain('/notes');
      expect(error.message).toContain('/explore');
      expect(error.message).toContain('--no-route-check');
    });

    it(`should suggest the nearest route as the command to run`, async () => {
      mockRouterProject(['index.tsx', 'notes.tsx']);
      mockDevServer([EXPO_GO_TARGET]);

      const error = await navigateAsync(projectRoot, options({ route: '/note' })).catch((e) => e);

      expect(error.suggestedCommand).toBe('npx exagent navigate /notes');
    });

    it(`should open a route the project has`, async () => {
      mockRouterProject(['index.tsx', 'notes.tsx']);
      mockDevServer([EXPO_GO_TARGET]);
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await expect(
        navigateAsync(projectRoot, options({ route: '/notes', json: true }))
      ).resolves.toBe(0);
      expect(JSON.parse(printed()).routeCheck).toEqual({
        checked: true,
        ok: true,
        matched: '/notes',
        routeCount: 3,
        reason: null,
      });
    });

    it(`should match a value against a dynamic route`, async () => {
      mockRouterProject(['index.tsx', 'users/[id].tsx']);
      mockDevServer([EXPO_GO_TARGET]);
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await expect(
        navigateAsync(projectRoot, options({ route: '/users/42', json: true }))
      ).resolves.toBe(0);
      expect(JSON.parse(printed()).routeCheck).toMatchObject({ ok: true, matched: '/users/[id]' });
    });

    it(`should open anything with --no-route-check`, async () => {
      mockRouterProject(['index.tsx']);
      mockDevServer([EXPO_GO_TARGET]);
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await expect(
        navigateAsync(projectRoot, options({ route: '/nope', routeCheck: false, json: true }))
      ).resolves.toBe(0);
      expect(JSON.parse(printed()).routeCheck).toMatchObject({
        checked: false,
        ok: null,
        reason: expect.stringContaining('--no-route-check'),
      });
    });

    // Fail open: a project this scan cannot read has not been shown to lack the route, and a
    // false red stops a command that would have worked.
    it(`should open the link when the project has no router directory`, async () => {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
      });
      mockDevServer([EXPO_GO_TARGET]);
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await expect(navigateAsync(projectRoot, options({ route: '/anything' }))).resolves.toBe(0);
    });

    // A chalk template inside an interpolation is a plain template literal, which prints its
    // `{dim …}` markers verbatim. The whole line is the report a human reads, so it is asserted.
    it(`should name the matched route in the human summary, with no markup left in it`, async () => {
      mockRouterProject(['index.tsx', 'notes.tsx']);
      mockDevServer([EXPO_GO_TARGET]);
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await navigateAsync(projectRoot, options({ route: '/notes' }));

      expect(printed()).toContain('/notes');
      expect(printed()).toContain('3 routes in this project');
      expect(printed()).not.toContain('{dim');
      expect(printed()).not.toContain('{bold');
    });

    it(`should not judge a full URL against this project's routes`, async () => {
      mockRouterProject(['index.tsx']);
      mockDevServer([EXPO_GO_TARGET]);
      mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

      await expect(
        navigateAsync(projectRoot, options({ route: 'otherapp://deep/link', json: true }))
      ).resolves.toBe(0);
      expect(JSON.parse(printed()).routeCheck).toMatchObject({
        checked: false,
        reason: expect.stringContaining('full URL'),
      });
    });
  });
  // @ref llp/0005-runtime-loop-tools.rfc.md §Resolving a URL without a device
  describe('--print-url', () => {
    function mockExpoGoProject() {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
      });
    }

    /** A detached log of a tunnelled run, and the lock of the run that wrote it. */
    function mockTunnelledRun(host: string) {
      vol.fromJSON({
        [`${projectRoot}/.expo/dev/logs/dev-detached.log`]: `Waiting on http://${host}\n`,
      });
      jest.mocked(readDevServerLockAsync).mockResolvedValue({
        url: 'http://127.0.0.1:8081',
        port: 8081,
        pid: 4242,
        // Before the log memfs just wrote, which is what proves the log is this run's.
        startedAt: '2020-01-01T00:00:00.000Z',
        projectRoot,
      });
    }

    // The whole point: no device is looked for, so nothing is spawned.
    it(`resolves the URL and spawns no device tool`, async () => {
      mockExpoGoProject();
      mockDevServer([EXPO_GO_TARGET]);
      mockSpawnQueue([]);

      await expect(navigateAsync(projectRoot, options({ printUrl: true }))).resolves.toBe(0);

      expect(spawn).not.toHaveBeenCalled();
      expect(printed()).toContain('exp://127.0.0.1:8081/--/profile/42');
      expect(printed()).toContain('nothing was opened');
    });

    it(`leads with the tunnel host rather than the address of this machine`, async () => {
      mockExpoGoProject();
      mockTunnelledRun('znakdiwe5j2n5o0.boltexpo.dev');
      mockDevServer([EXPO_GO_TARGET]);

      await navigateAsync(projectRoot, options({ devServerUrl: null, printUrl: true, json: true }));

      const report = JSON.parse(printed());
      expect(report.url).toBe('exp://znakdiwe5j2n5o0.boltexpo.dev/--/profile/42');
      expect(report.hostType).toBe('tunnel');
      expect(report.devServerUrl).toBe('http://127.0.0.1:8081');
    });

    it(`reports the tunnel as the host when the tunnel is up`, async () => {
      mockExpoGoProject();
      mockTunnelledRun('znakdiwe5j2n5o0.boltexpo.dev');
      mockDevServer([EXPO_GO_TARGET]);

      await navigateAsync(projectRoot, options({ devServerUrl: null, printUrl: true, json: true }));

      expect(JSON.parse(printed())).toMatchObject({ hostType: 'tunnel' });
    });

    // A development build's URL carries no dev server host at all: it reaches whatever the app was
    // launched against, and claiming a reach for it would be a claim this command cannot make.
    it(`reports no host type for a development build's scheme URL`, async () => {
      mockExpoGoProject();
      mockDevServer([{ id: '1', appId: 'com.example.demo' }]);

      await navigateAsync(projectRoot, options({ printUrl: true, json: true }));

      const report = JSON.parse(printed());
      expect(report.url).toBe('demoapp://profile/42');
      expect(report.hostType).toBeNull();
    });

    it(`keeps the four device keys and fills them with null`, async () => {
      mockExpoGoProject();
      mockDevServer([EXPO_GO_TARGET]);

      await navigateAsync(projectRoot, options({ printUrl: true, json: true }));

      const report = JSON.parse(printed());
      expect(report).toMatchObject({
        printUrl: true,
        platform: null,
        deviceId: null,
        command: null,
        exitCode: null,
      });
      expect(Object.keys(report).sort()).toEqual([
        'appId',
        'command',
        'devServerSource',
        'devServerUrl',
        'deviceId',
        'exitCode',
        'followups',
        'hostType',
        'platform',
        'printUrl',
        'resolution',
        'route',
        'routeCheck',
        'target',
        'url',
      ]);
    });

    // The route check still runs: a URL for a route the project has not got is not an answer.
    it(`still refuses a route the project has not got`, async () => {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo' } }),
        [`${projectRoot}/app/index.tsx`]: 'export default function Index() {}',
      });
      mockDevServer([EXPO_GO_TARGET]);

      await expect(
        navigateAsync(projectRoot, options({ route: '/nope', printUrl: true }))
      ).rejects.toThrow(/nope/);
    });
  });

  // @ref llp/0009-smart-followups.rfc.md §Device-aware ladders
  describe('a machine with no device', () => {
    it(`names the URL and the mode that needs no device`, async () => {
      vol.fromJSON({
        [`${projectRoot}/package.json`]: JSON.stringify({ name: 'demo', dependencies: {} }),
        [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo', scheme: 'demoapp' } }),
      });
      mockDevServer([EXPO_GO_TARGET]);
      // No booted simulator, and no attached Android device.
      mockSpawnQueue([
        { stdout: JSON.stringify({ devices: {} }) },
        { stdout: 'List of devices attached\n' },
      ]);

      await expect(navigateAsync(projectRoot, options())).rejects.toMatchObject({
        code: 'NO_DEVICE',
        message: expect.stringContaining('exp://127.0.0.1:8081/--/profile/42'),
        suggestedCommand: 'npx exagent navigate / --print-url',
      });
    });
  });
});
