import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { readDevServerLockAsync, readLastLoggedDevServerPort } from '../../devLock';
import { runtimeStopAsync } from '../stopAsync';
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
      'bundleId',
      'bundleIdReason',
      'bundleIdSource',
      'command',
      'deviceId',
      'followups',
      'platform',
      'reason',
      'stopped',
      'wasRunning',
    ]);
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
