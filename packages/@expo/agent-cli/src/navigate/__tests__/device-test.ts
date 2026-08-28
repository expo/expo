import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';
import path from 'path';

import {
  parseBootedIosSimulator,
  parseFirstAndroidDevice,
  probeAndroidDeviceAsync,
  probeIosSimulatorAsync,
  resolveDeviceAsync,
} from '../device';

const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

/** Answer every `spawn` call with the queued stdout and exit code. */
function mockSpawnQueue(answers: { stdout?: string; exitCode?: number | null }[]) {
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

const BOOTED_SIMCTL_JSON = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.watchOS-26-0': [
      { udid: 'WATCH-1', name: 'Apple Watch', state: 'Booted', dataPath: '/watch' },
    ],
    'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [
      { udid: 'IOS-1', name: 'iPhone 17', state: 'Booted', dataPath: '/ios' },
      { udid: 'IOS-2', name: 'iPad', state: 'Booted', dataPath: '/ipad' },
    ],
  },
});

const ADB_DEVICES = ['List of devices attached', 'ZZZZ\tunauthorized', 'emulator-5554\tdevice', ''];

afterEach(() => {
  mockPlatform(realPlatform);
});

describe(parseBootedIosSimulator, () => {
  it(`should pick the first booted iOS simulator and skip other runtimes`, () => {
    expect(parseBootedIosSimulator(BOOTED_SIMCTL_JSON)).toEqual({
      udid: 'IOS-1',
      name: 'iPhone 17',
    });
  });

  it(`should return null when nothing is booted`, () => {
    expect(parseBootedIosSimulator(JSON.stringify({ devices: {} }))).toBeNull();
  });

  it(`should return null for output that is not simctl JSON`, () => {
    expect(parseBootedIosSimulator('not json')).toBeNull();
    expect(parseBootedIosSimulator('')).toBeNull();
  });
});

describe(parseFirstAndroidDevice, () => {
  it(`should pick the first device that is ready and skip the others`, () => {
    expect(parseFirstAndroidDevice(ADB_DEVICES.join('\n'))).toBe('emulator-5554');
  });

  it(`should return null when no device is attached`, () => {
    expect(parseFirstAndroidDevice('List of devices attached\n\n')).toBeNull();
  });
});

describe(probeIosSimulatorAsync, () => {
  it(`should return the booted simulator`, async () => {
    mockSpawnQueue([{ stdout: BOOTED_SIMCTL_JSON }]);

    await expect(probeIosSimulatorAsync()).resolves.toEqual({
      device: { backend: 'local-ios', platform: 'ios', deviceId: 'IOS-1', name: 'iPhone 17' },
    });
    expect(spawn).toHaveBeenCalledWith(
      'xcrun',
      ['simctl', 'list', 'devices', 'booted', '-j'],
      expect.anything()
    );
  });

  it(`should report no simulator when none is booted`, async () => {
    mockSpawnQueue([{ stdout: JSON.stringify({ devices: {} }) }]);

    const probe = await probeIosSimulatorAsync();

    expect(probe.device).toBeNull();
    expect(probe.reason).toMatch(/booted/i);
  });

  it(`should report a failing simctl call`, async () => {
    mockSpawnQueue([{ stdout: '', exitCode: 1 }]);

    expect((await probeIosSimulatorAsync()).device).toBeNull();
  });
});

describe(probeAndroidDeviceAsync, () => {
  it(`should return the first attached device`, async () => {
    mockSpawnQueue([{ stdout: ADB_DEVICES.join('\n') }]);

    const probe = await probeAndroidDeviceAsync();

    expect(probe.device).toMatchObject({ platform: 'android', deviceId: 'emulator-5554' });
    // The resolution travels with the device, so every later `adb` call spawns the same binary
    // (`src/device/adb.ts`, F49).
    expect(probe.device?.adb?.bin).toBeTruthy();
    // The long listing, because its `model:` field is what ties a debugger target back to this
    // device (`src/runtime/targetPlatform.ts`).
    expect(spawn).toHaveBeenCalledWith(
      expect.stringMatching(/adb(\.exe)?$/),
      ['devices', '-l'],
      expect.anything()
    );
  });

  it(`should report an unrunnable adb as a tool failure rather than as a missing device`, async () => {
    jest.mocked(spawn).mockImplementation((() => {
      const child = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      process.nextTick(() =>
        child.emit('error', Object.assign(new Error('spawn adb ENOENT'), { code: 'ENOENT' }))
      );
      return child as any;
    }) as any);

    const probe = await probeAndroidDeviceAsync();

    expect(probe.device).toBeNull();
    expect(probe.toolError?.code).toBe('ADB_NOT_RUNNABLE');
    // The headline a reader gets must not send them to boot a device they already have (F49).
    expect(probe.reason).not.toMatch(/no android device/i);
  });

  it(`should report no device when none is attached`, async () => {
    mockSpawnQueue([{ stdout: 'List of devices attached\n' }]);

    const probe = await probeAndroidDeviceAsync();

    expect(probe.device).toBeNull();
    expect(probe.reason).toMatch(/no android/i);
  });
});

describe(resolveDeviceAsync, () => {
  it(`should use the booted iOS simulator when --ios is given`, async () => {
    mockSpawnQueue([{ stdout: BOOTED_SIMCTL_JSON }]);

    await expect(resolveDeviceAsync('ios')).resolves.toEqual({
      backend: 'local-ios',
      platform: 'ios',
      deviceId: 'IOS-1',
      name: 'iPhone 17',
    });
  });

  // The cloud backend costs money and spawns an `eas`, so it is on the ladder only for the callers
  // that put it there. Every `runtime:*` action keeps the old two-backend resolution exactly.
  it(`never looks for a cloud session unless the caller asked for one`, async () => {
    mockPlatform('darwin');
    mockSpawnQueue([
      { stdout: JSON.stringify({ devices: {} }) },
      { stdout: 'List of devices attached\n' },
    ]);

    await resolveDeviceAsync().catch(() => {});

    // Two probes and nothing else: no `eas` was started to find out about a session.
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it(`should explain how to boot a simulator when --ios finds none`, async () => {
    mockSpawnQueue([{ stdout: JSON.stringify({ devices: {} }) }]);

    const error = await resolveDeviceAsync('ios').catch((e) => e);

    expect(error.code).toBe('NO_IOS_DEVICE');
    expect(error.message).toContain('npx exagent dev --detach');
  });

  it(`should explain how to start an emulator when --android finds none`, async () => {
    mockSpawnQueue([{ stdout: 'List of devices attached\n' }]);

    const error = await resolveDeviceAsync('android').catch((e) => e);

    expect(error.code).toBe('NO_ANDROID_DEVICE');
    expect(error.message).toContain('adb devices');
  });

  it(`should prefer a booted iOS simulator on macOS when no platform is given`, async () => {
    mockPlatform('darwin');
    mockSpawnQueue([{ stdout: BOOTED_SIMCTL_JSON }]);

    await expect(resolveDeviceAsync()).resolves.toMatchObject({ platform: 'ios' });
  });

  it(`should fall back to Android on macOS when no simulator is booted`, async () => {
    mockPlatform('darwin');
    mockSpawnQueue([
      { stdout: JSON.stringify({ devices: {} }) },
      { stdout: ADB_DEVICES.join('\n') },
    ]);

    await expect(resolveDeviceAsync()).resolves.toMatchObject({
      platform: 'android',
      deviceId: 'emulator-5554',
    });
  });

  it(`should only look for an Android device off macOS`, async () => {
    mockPlatform('linux');
    mockSpawnQueue([{ stdout: ADB_DEVICES.join('\n') }]);

    await expect(resolveDeviceAsync()).resolves.toMatchObject({ platform: 'android' });
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it(`should name both platforms when nothing is booted`, async () => {
    mockPlatform('darwin');
    mockSpawnQueue([
      { stdout: JSON.stringify({ devices: {} }) },
      { stdout: 'List of devices attached\n' },
    ]);

    const error = await resolveDeviceAsync().catch((e) => e);

    expect(error.code).toBe('NO_DEVICE');
    expect(error.message).toContain('--ios');
    expect(error.message).toContain('--android');
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The cloud simulator backend
//
// The ladder, not the argv: `src/device/__tests__/cloudSimulator-test.ts` pins what is sent to the
// EAS CLI, and what is pinned here is *when* it is sent and which backend wins.
describe(`${resolveDeviceAsync.name} with the cloud backend`, () => {
  /**
   * The runner every `eas` invocation goes through, planted where the resolver will look.
   *
   * A real `PATH` entry of this process, because these suites run on memfs and the resolver searches
   * `process.env.PATH` (`src/utils/easCli.ts` §resolveEasCli). Planting a `node_modules/.bin/eas`
   * used to be what made this hermetic; there is no rung that reads one any more.
   */
  const RUNNER = path.join(
    (process.env.PATH ?? '/usr/local/bin').split(path.delimiter)[0]!,
    'npx'
  );

  /** A project the cloud backend can be resolved in, and optionally a session on record. */
  function cloudProject(sessionId: string | null): void {
    vol.fromJSON({
      '/project/package.json': '{}',
      [RUNNER]: '#!/bin/sh\n',
      ...(sessionId
        ? { '/project/.env.eas-simulator': `EAS_SIMULATOR_SESSION_ID=${sessionId}\n` }
        : {}),
    });
  }

  /** One live `agent-device` session, in the shape `simulator:list --json` prints. */
  function listing(...rows: Record<string, string>[]): string {
    return JSON.stringify({ sessions: rows, pageInfo: { hasNextPage: false } });
  }

  const liveSession = listing({
    id: 'sess-1',
    status: 'IN_PROGRESS',
    platform: 'IOS',
    type: 'agent-device',
    createdAt: '2026-08-26T10:00:00.000Z',
  });

  /** Nothing running, and an account that does have the feature. */
  const noSessions = [{ stdout: listing() }, { stdout: '{"available": true}' }];

  afterEach(() => vol.reset());

  it(`opens on the cloud session when this machine has no local device`, async () => {
    mockPlatform('darwin');
    cloudProject('sess-1');
    mockSpawnQueue([
      { stdout: JSON.stringify({ devices: {} }) },
      { stdout: 'List of devices attached\n' },
      { stdout: liveSession },
    ]);

    await expect(
      resolveDeviceAsync(undefined, { cloud: 'fallback', projectRoot: '/project' })
    ).resolves.toMatchObject({ backend: 'cloud', platform: 'ios', deviceId: 'sess-1' });
  });

  // The local device is free, instant, and the one a developer is looking at. A cloud session must
  // never quietly take a run away from it.
  it(`prefers the local simulator over a session that is also up`, async () => {
    mockPlatform('darwin');
    cloudProject('sess-1');
    mockSpawnQueue([{ stdout: BOOTED_SIMCTL_JSON }]);

    await expect(
      resolveDeviceAsync(undefined, { cloud: 'fallback', projectRoot: '/project' })
    ).resolves.toMatchObject({ backend: 'local-ios' });
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  // The rung asks the service rather than the filesystem now, so a project with no dotenv still
  // finds a session somebody else started — and a project with nothing running still says so.
  it(`asks the service even when the project has no dotenv`, async () => {
    mockPlatform('linux');
    cloudProject(null);
    mockSpawnQueue([{ stdout: 'List of devices attached\n' }, { stdout: liveSession }]);

    await expect(
      resolveDeviceAsync(undefined, { cloud: 'fallback', projectRoot: '/project' })
    ).resolves.toMatchObject({ backend: 'cloud', deviceId: 'sess-1' });
  });

  it(`still reports no device when the service lists nothing`, async () => {
    mockPlatform('linux');
    cloudProject(null);
    mockSpawnQueue([{ stdout: 'List of devices attached\n' }, ...noSessions]);

    const error = await resolveDeviceAsync(undefined, {
      cloud: 'fallback',
      projectRoot: '/project',
    }).catch((e) => e);

    expect(error.code).toBe('NO_DEVICE');
  });

  it(`names a session that is on record and not running, in the failure`, async () => {
    mockPlatform('linux');
    cloudProject('sess-1');
    mockSpawnQueue([{ stdout: 'List of devices attached\n' }, ...noSessions]);

    const error = await resolveDeviceAsync(undefined, {
      cloud: 'fallback',
      projectRoot: '/project',
    }).catch((e) => e);

    expect(error.message).toContain('EAS Simulator session on record');
    expect(error.message).toContain('eas simulator --platform ios');
  });

  // `--cloud` names the device, so no local tool is asked at all.
  it(`asks no local tool when --cloud named the backend`, async () => {
    mockPlatform('darwin');
    cloudProject('sess-1');
    mockSpawnQueue([{ stdout: liveSession }]);

    await expect(
      resolveDeviceAsync(undefined, { cloud: 'required', projectRoot: '/project' })
    ).resolves.toMatchObject({ backend: 'cloud', deviceId: 'sess-1' });
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it(`refuses a platform flag the session is not`, async () => {
    cloudProject('sess-1');
    mockSpawnQueue([{ stdout: liveSession }]);

    const error = await resolveDeviceAsync('android', {
      cloud: 'required',
      projectRoot: '/project',
    }).catch((e) => e);

    expect(error.code).toBe('CLOUD_SIMULATOR_PLATFORM_MISMATCH');
    expect(error.message).toContain('--ios');
  });

  it(`names how to start a session when --cloud finds none`, async () => {
    cloudProject(null);
    mockSpawnQueue(noSessions);

    const error = await resolveDeviceAsync(undefined, {
      cloud: 'required',
      projectRoot: '/project',
    }).catch((e) => e);

    expect(error.code).toBe('NO_CLOUD_SIMULATOR_SESSION');
    expect(error.message).toContain('eas simulator --platform ios --type agent-device --expo-go');
  });

  // A tool that did not answer has said nothing, and "start a session" would start a second one.
  it(`does not claim there is no session when the eas run could not be read`, async () => {
    cloudProject('sess-1');
    mockSpawnQueue([{ stdout: '<html>', exitCode: 0 }]);

    const error = await resolveDeviceAsync(undefined, {
      cloud: 'required',
      projectRoot: '/project',
    }).catch((e) => e);

    expect(error.code).toBe('CLOUD_SIMULATOR_SESSION_UNKNOWN');
    expect(error.message).not.toContain('simulator:start');
  });
});
