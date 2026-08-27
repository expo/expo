import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { readDevServerLockAsync, readLastLoggedDevServerPort } from '../../devLock';
import { buildStopFollowUps, runtimeStopAsync, type RuntimeStopResultJson } from '../stopAsync';
import type { RuntimeStopOptions } from '../resolveStopOptions';

jest.mock('../../devLock', () => ({
  readDevServerLockAsync: jest.fn(async () => null),
  readLastLoggedDevServerPort: jest.fn(() => null),
}));

const projectRoot = '/project';
const realPlatform = process.platform;

const BOOTED_SIMULATOR = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
      { udid: 'IOS-1', name: 'iPhone 17', state: 'Booted' },
    ],
  },
});

interface SpawnAnswer {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
}

function mockSpawnQueue(answers: SpawnAnswer[]) {
  let call = 0;
  jest.mocked(spawn).mockImplementation((() => {
    const answer = answers[call++] ?? {};
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    process.nextTick(() => {
      if (answer.stdout) child.stdout.emit('data', answer.stdout);
      if (answer.stderr) child.stderr.emit('data', answer.stderr);
      child.emit('close', answer.exitCode ?? 0, null);
    });
    return child as any;
  }) as any);
}

function spawnedArgv(index: number): string[] {
  const [bin, args] = jest.mocked(spawn).mock.calls[index] as unknown as [string, string[]];
  return [bin, ...args];
}

function mockDevServer(targets: unknown[] | null) {
  globalThis.fetch = (async () => {
    if (targets == null) {
      throw new Error('fetch failed');
    }
    return { ok: true, json: async () => targets };
  }) as unknown as typeof fetch;
}

function options(overrides: Partial<RuntimeStopOptions> = {}): RuntimeStopOptions {
  return {
    devServerUrl: 'http://127.0.0.1:8081',
    cloud: false,
    json: true,
    followups: false,
    ...overrides,
  };
}

function printed(): string {
  return jest.mocked(console.log).mock.calls.flat().join('\n');
}

let originalFetch: typeof fetch | undefined;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  jest.mocked(readDevServerLockAsync).mockResolvedValue(null);
  jest.mocked(readLastLoggedDevServerPort).mockReturnValue(null);
  Object.defineProperty(process, 'platform', { value: 'darwin' });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  vol.fromJSON({ [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo' } }) });
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  }
  Object.defineProperty(process, 'platform', { value: realPlatform });
  vol.reset();
});

describe(runtimeStopAsync, () => {
  it(`should terminate the connected app on the booted simulator`, async () => {
    mockDevServer([{ id: '1', appId: 'host.exp.Exponent' }]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await expect(runtimeStopAsync(projectRoot, options())).resolves.toBe(0);

    expect(spawnedArgv(1)).toEqual(['xcrun', 'simctl', 'terminate', 'IOS-1', 'host.exp.Exponent']);
    expect(JSON.parse(printed())).toMatchObject({
      stopped: true,
      wasRunning: true,
      platform: 'ios',
      deviceId: 'IOS-1',
      bundleId: 'host.exp.Exponent',
      bundleIdSource: 'dev-server',
      reason: null,
    });
  });

  it(`should print a stable set of top-level keys with --json`, async () => {
    mockDevServer([{ id: '1', appId: 'host.exp.Exponent' }]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await runtimeStopAsync(projectRoot, options());

    expect(Object.keys(JSON.parse(printed())).sort()).toEqual([
      'appIdMismatch',
      'bundleId',
      'bundleIdReason',
      'bundleIdSource',
      'command',
      'connectedAppIds',
      'deviceBackend',
      'deviceId',
      'followups',
      'platform',
      'reason',
      'stopped',
      'wasRunning',
    ]);
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §An --app-id nobody is running — friction run 4, F42.
  // The three facts have to be read together: the caller named an id, that id was not running, and
  // something else is. Each alone is ordinary; the conjunction is a typo, and the old command
  // exited 0 with "The app was not running, so this is what starts it" while the app kept running.
  it(`should exit 20 when --app-id names an app that is not the one connected`, async () => {
    mockDevServer([{ id: '1', appId: 'host.exp.Exponent' }]);
    mockSpawnQueue([
      { stdout: BOOTED_SIMULATOR },
      { exitCode: 4, stderr: 'found nothing to terminate' },
    ]);

    await expect(
      runtimeStopAsync(projectRoot, options({ appId: 'host.exp.Exponent2' }))
    ).resolves.toBe(20);
    expect(JSON.parse(printed())).toMatchObject({
      wasRunning: false,
      bundleId: 'host.exp.Exponent2',
      connectedAppIds: ['host.exp.Exponent'],
      appIdMismatch: true,
    });
    const explained = jest.mocked(console.error).mock.calls.flat().join('\n');
    expect(explained).toContain('host.exp.Exponent');
    expect(explained).toContain('--app-id host.exp.Exponent');
  });

  it(`should name the corrected command in the follow-ups of a mismatch`, async () => {
    mockDevServer([{ id: '1', appId: 'host.exp.Exponent' }]);
    mockSpawnQueue([
      { stdout: BOOTED_SIMULATOR },
      { exitCode: 4, stderr: 'found nothing to terminate' },
    ]);

    await runtimeStopAsync(
      projectRoot,
      options({ appId: 'host.exp.Exponent2', followups: true })
    );

    const followups = JSON.parse(printed()).followups;
    expect(followups[0].command).toBe('npx exagent runtime:stop --app-id host.exp.Exponent');
    // The old list led with `navigate /`, which starts an app while another one is still running.
    expect(followups.map((followup: { id: string }) => followup.id)).not.toContain('navigate');
  });

  // The id was right and the app was running under it: nothing is suspicious about a connected app
  // with another id, because a device can run more than one.
  it(`should stay at 0 when the app --app-id named was running`, async () => {
    mockDevServer([{ id: '1', appId: 'host.exp.Exponent' }]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await expect(
      runtimeStopAsync(projectRoot, options({ appId: 'com.example.other' }))
    ).resolves.toBe(0);
    expect(JSON.parse(printed())).toMatchObject({ wasRunning: true, appIdMismatch: false });
  });

  // Without `--app-id` the id came from the dev server itself, so it cannot disagree with it. A
  // second `runtime:stop` must stay 0, which is what makes the command idempotent.
  it(`should stay at 0 for a repeat stop with nothing connected`, async () => {
    mockDevServer([]);
    mockSpawnQueue([
      { stdout: BOOTED_SIMULATOR },
      { exitCode: 4, stderr: 'found nothing to terminate' },
    ]);

    await expect(
      runtimeStopAsync(projectRoot, options({ appId: 'host.exp.Exponent2' }))
    ).resolves.toBe(0);
    expect(JSON.parse(printed())).toMatchObject({ appIdMismatch: false, connectedAppIds: [] });
  });

  it(`should stop the id --app-id names`, async () => {
    mockDevServer([{ id: '1', appId: 'host.exp.Exponent' }]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await runtimeStopAsync(projectRoot, options({ appId: 'com.example.other' }));

    expect(spawnedArgv(1)).toContain('com.example.other');
    expect(JSON.parse(printed()).bundleIdSource).toBe('flag');
  });

  it(`should read the bundle id from the app config when nothing is connected`, async () => {
    vol.fromJSON({
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: { slug: 'demo', ios: { bundleIdentifier: 'com.example.demo' } },
      }),
    });
    mockDevServer([]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await runtimeStopAsync(projectRoot, options());

    expect(JSON.parse(printed())).toMatchObject({
      bundleId: 'com.example.demo',
      bundleIdSource: 'app-config',
    });
  });

  // An app that was not running is the state the caller asked for. `simctl terminate` exits
  // non-zero for it, and reading that as a failure would make a second stop fail for having
  // nothing left to do.
  it(`should report an app that was not running as a success with a note`, async () => {
    mockDevServer([]);
    mockSpawnQueue([
      { stdout: BOOTED_SIMULATOR },
      { exitCode: 4, stderr: 'found nothing to terminate' },
    ]);

    await expect(runtimeStopAsync(projectRoot, options())).resolves.toBe(0);
    expect(JSON.parse(printed())).toMatchObject({
      stopped: true,
      wasRunning: false,
      reason: null,
    });
  });

  it(`should report a device that refused, and name the app it tried`, async () => {
    mockDevServer([]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { exitCode: 1, stderr: 'Invalid device: NOPE' }]);

    await expect(runtimeStopAsync(projectRoot, options())).resolves.toBe(1);
    const report = JSON.parse(printed());
    expect(report).toMatchObject({ stopped: false, wasRunning: false });
    expect(report.reason).toBe('Invalid device: NOPE');
    expect(jest.mocked(console.error).mock.calls.flat().join('\n')).toContain('--app-id');
  });

  // The command reads the dev server for evidence, and an app can be running with no dev server
  // behind it at all — so an unreachable one must cost the evidence, not the command.
  it(`should still stop the app when no dev server answers`, async () => {
    mockDevServer(null);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await expect(runtimeStopAsync(projectRoot, options())).resolves.toBe(0);
    expect(JSON.parse(printed())).toMatchObject({
      stopped: true,
      bundleIdSource: 'expo-go-default',
    });
  });

  it(`should force-stop the app on an Android device`, async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    mockDevServer([]);
    mockSpawnQueue([
      { stdout: 'List of devices attached\nemulator-5554\tdevice\n' },
      { stdout: '' },
    ]);

    await expect(runtimeStopAsync(projectRoot, options({ platform: 'android' }))).resolves.toBe(0);
    expect(spawnedArgv(1)).toEqual([
      'adb',
      '-s',
      'emulator-5554',
      'shell',
      'am',
      'force-stop',
      'host.exp.exponent',
    ]);
  });

  it(`should offer navigate as the way back`, async () => {
    mockDevServer([]);
    mockSpawnQueue([{ stdout: BOOTED_SIMULATOR }, { stdout: '' }]);

    await runtimeStopAsync(projectRoot, options({ followups: true }));

    expect(JSON.parse(printed()).followups).toEqual([
      { id: 'navigate', command: 'npx exagent navigate /', why: expect.any(String) },
    ]);
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §What `close` will not tell you — live staging, S13.
//
// On a cloud session `wasRunning` is null: the controller closes the app in front and answers the
// same way whatever application id it was given. The follow-up read that null as `false` and
// asserted "The app was not running" while Expo Go was running on the session.
describe(buildStopFollowUps, () => {
  function report(overrides: Partial<RuntimeStopResultJson> = {}): RuntimeStopResultJson {
    return {
      stopped: true,
      wasRunning: true,
      platform: 'ios',
      deviceBackend: 'local-ios',
      deviceId: 'IOS-1',
      bundleId: 'host.exp.Exponent',
      bundleIdSource: 'dev-server',
      bundleIdReason: 'the dev server named it',
      command: 'xcrun simctl terminate IOS-1 host.exp.Exponent',
      reason: null,
      connectedAppIds: [],
      appIdMismatch: false,
      followups: [],
      ...overrides,
    };
  }

  it(`says the app is stopped when this command is what stopped it`, () => {
    expect(buildStopFollowUps(report())[0]!.why).toContain('The app is stopped');
  });

  it(`says the app was not running only when that was established`, () => {
    expect(buildStopFollowUps(report({ wasRunning: false }))[0]!.why).toContain(
      'The app was not running'
    );
  });

  it(`claims neither when the controller reported neither`, () => {
    const why = buildStopFollowUps(
      report({ wasRunning: null, deviceBackend: 'cloud', deviceId: 'session-1' })
    )[0]!.why;

    expect(why).not.toContain('The app was not running');
    expect(why).toMatch(/not something the session's controller reports/);
    expect(why).toContain('cloud simulator session');
  });

  it(`still carries --cloud into the command it suggests`, () => {
    expect(
      buildStopFollowUps(report({ wasRunning: null, deviceBackend: 'cloud' }))[0]!.command
    ).toBe('npx exagent navigate / --cloud');
  });
});
