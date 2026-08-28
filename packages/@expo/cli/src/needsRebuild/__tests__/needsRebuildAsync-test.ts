import { vol } from 'memfs';

import { getNativeDirectoryStaleness, importFingerprint } from '../../utils/nativeFingerprint';
import { getConfigEnvMode, loadEnvFiles } from '../../utils/nodeEnv';
import { getInstalledFingerprintAndroidAsync } from '../getInstalledFingerprintAndroidAsync';
import { getInstalledFingerprintIosAsync } from '../getInstalledFingerprintIosAsync';
import { checkNeedsRebuildAsync, needsRebuildAsync } from '../needsRebuildAsync';

// Only the parts that reach outside the process are mocked; the pure helpers (option parity,
// change formatting) stay real so the assertions cover what the command actually prints.
jest.mock('../../utils/nativeFingerprint', () => ({
  ...jest.requireActual('../../utils/nativeFingerprint'),
  importFingerprint: jest.fn(),
  getNativeDirectoryStaleness: jest.fn(),
}));
jest.mock('../../utils/nodeEnv');
jest.mock('../getInstalledFingerprintIosAsync');
jest.mock('../getInstalledFingerprintAndroidAsync');

const projectRoot = '/app';

const device = { name: 'iPhone 17', identifier: 'UDID-1' };

function mockInstalled(hash: string | null, platform: 'ios' | 'android' = 'ios') {
  const result =
    hash == null
      ? ({ status: 'no-device' } as const)
      : ({ status: 'ok', hash, appId: 'dev.expo.app', device } as const);
  const fn =
    platform === 'ios' ? getInstalledFingerprintIosAsync : getInstalledFingerprintAndroidAsync;
  jest.mocked(fn).mockResolvedValue(result as any);
}

beforeEach(() => {
  vol.reset();
  jest.mocked(importFingerprint).mockReturnValue({
    Fingerprint: {
      createFingerprintAsync: jest.fn(async () => ({
        hash: 'current-hash',
        sources: [],
      })),
    } as any,
    version: '0.19.3',
  });
  jest.mocked(getNativeDirectoryStaleness).mockReturnValue({
    status: 'not-applicable',
    changes: [],
  });
  mockInstalled('current-hash', 'ios');
  mockInstalled('current-hash', 'android');
});

describe(checkNeedsRebuildAsync, () => {
  it.each([
    {
      name: 'the installed hash matches',
      installed: { status: 'ok', hash: 'current-hash', appId: 'dev.expo.app', device },
      expected: {
        status: 'up-to-date',
        reason: 'hash-match',
        commands: [],
        installedHash: 'current-hash',
        currentHash: 'current-hash',
        exitCode: 0,
      },
    },
    {
      name: 'the installed hash differs',
      installed: { status: 'ok', hash: 'old-hash', appId: 'dev.expo.app', device },
      expected: {
        status: 'rebuild-required',
        reason: 'hash-mismatch',
        commands: ['npx expo run:ios'],
        installedHash: 'old-hash',
        currentHash: 'current-hash',
        exitCode: 2,
      },
    },
    {
      name: 'the app is not installed',
      installed: { status: 'app-not-installed', appId: 'dev.expo.app', device },
      expected: {
        status: 'unknown',
        reason: 'app-not-installed',
        commands: ['npx expo run:ios'],
        installedHash: null,
        exitCode: 4,
      },
    },
    {
      name: 'the app has no embedded fingerprint',
      installed: { status: 'no-embedded-fingerprint', appId: 'dev.expo.app', device },
      expected: {
        status: 'unknown',
        reason: 'no-embedded-fingerprint',
        commands: ['npx expo run:ios'],
        installedHash: null,
        exitCode: 4,
      },
    },
    {
      name: 'no device can be reached',
      installed: { status: 'no-device' },
      expected: {
        status: 'unknown',
        reason: 'no-device',
        commands: [],
        installedHash: null,
        exitCode: 4,
      },
    },
    {
      name: 'the device never reports its fingerprint',
      installed: { status: 'no-response', appId: 'dev.expo.app', device },
      expected: {
        status: 'unknown',
        reason: 'no-response',
        commands: [],
        installedHash: null,
        exitCode: 4,
      },
    },
  ])(`reports the verdict when $name`, async ({ installed, expected }) => {
    jest.mocked(getInstalledFingerprintIosAsync).mockResolvedValue(installed as any);
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject(expected);
    expect(result.exitCode).toBe(expected.exitCode);
  });

  it(`explains the likely causes and the fix when the device never reports its fingerprint`, async () => {
    jest
      .mocked(getInstalledFingerprintIosAsync)
      .mockResolvedValue({ status: 'no-response', appId: 'dev.expo.app', device });
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], { explicit: true });
    const recommendation = result.platforms.ios!.recommendation;
    expect(recommendation).toContain('same network');
    expect(recommendation).toContain('Local Network');
    expect(recommendation).toContain('npx expo run:ios --device');
  });

  it(`appends the reader's hint to the recommendation when present`, async () => {
    jest.mocked(getInstalledFingerprintIosAsync).mockResolvedValue({
      status: 'no-embedded-fingerprint',
      appId: 'dev.expo.app',
      device,
      hint: 'A physical iOS device is also connected. Check it with --device "iPhone".',
    });
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], { explicit: true });
    expect(result.platforms.ios!.recommendation).toContain(
      'A physical iOS device is also connected. Check it with --device "iPhone".'
    );
  });

  it(`describes both simulators and physical devices in the no-device message on iOS`, async () => {
    jest.mocked(getInstalledFingerprintIosAsync).mockResolvedValue({ status: 'no-device' });
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], { explicit: true });
    const recommendation = result.platforms.ios!.recommendation;
    expect(recommendation).not.toContain('Physical iOS devices are not supported');
    expect(recommendation).toContain('--device');
  });

  it(`passes the expected hash to the reader as a promise, so the device read overlaps it`, async () => {
    await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(getInstalledFingerprintIosAsync).toHaveBeenCalledWith(projectRoot, {
      expectedHash: expect.any(Promise),
    });
    await expect(
      jest.mocked(getInstalledFingerprintIosAsync).mock.calls[0]![1].expectedHash
    ).resolves.toBe('current-hash');
  });

  it(`exits 3 when the prebuild marker is stale, without waiting for a device`, async () => {
    jest.mocked(getNativeDirectoryStaleness).mockReturnValue({
      status: 'stale',
      changes: [
        { source: 'app config', change: 'changed', scope: 'project' },
        { source: 'plugins/withFoo.js', change: 'added', scope: 'project' },
      ],
    });
    // The concurrently started device read must not affect the verdict, even when it fails.
    jest.mocked(getInstalledFingerprintIosAsync).mockRejectedValue(new Error('device offline'));
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'rebuild-required',
      reason: 'prebuild-stale',
      commands: ['npx expo prebuild -p ios', 'npx expo run:ios'],
      prebuildStatus: 'stale',
      exitCode: 3,
    });
    // The verdict names what changed, so the developer (or agent) can act without guessing.
    expect(result.platforms.ios!.recommendation).toContain('app config, plugins/withFoo.js');
    expect(result.platforms.ios!.prebuildChanges).toEqual([
      { source: 'app config', change: 'changed', scope: 'project' },
      { source: 'plugins/withFoo.js', change: 'added', scope: 'project' },
    ]);
    expect(result.exitCode).toBe(3);
  });

  it(`exits 4 when @expo/fingerprint is unavailable`, async () => {
    jest.mocked(importFingerprint).mockReturnValue(null);
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'unknown',
      reason: 'fingerprint-unavailable',
      exitCode: 4,
    });
    expect(result.exitCode).toBe(4);
  });

  it(`exits 4 when the device check fails unexpectedly`, async () => {
    jest
      .mocked(getInstalledFingerprintIosAsync)
      .mockRejectedValue(new Error('adb: device offline'));
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'unknown',
      reason: 'check-failed',
      exitCode: 4,
    });
    expect(result.platforms.ios?.recommendation).toContain('adb: device offline');
    expect(result.exitCode).toBe(4);
  });

  it(`does not leak an unhandled rejection when the fingerprint fails on a no-device path`, async () => {
    const unhandled: unknown[] = [];
    const listener = (reason: unknown) => unhandled.push(reason);
    process.on('unhandledRejection', listener);
    try {
      jest.mocked(importFingerprint).mockReturnValue({
        Fingerprint: {
          createFingerprintAsync: jest.fn(async () => {
            throw new Error('config evaluation failed');
          }),
        } as any,
        version: '0.19.3',
      });
      // The reader resolves without ever awaiting `expectedHash`, like the real no-device path.
      jest.mocked(getInstalledFingerprintIosAsync).mockResolvedValue({ status: 'no-device' });

      const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], { explicit: true });
      expect(result.platforms.ios).toMatchObject({ reason: 'check-failed', exitCode: 4 });

      // Let any pending rejection reach the process listener before asserting.
      await new Promise(setImmediate);
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', listener);
    }
  });

  it(`names --unstable-rebundle among the causes on iOS only`, async () => {
    const installed = { status: 'no-embedded-fingerprint', appId: 'dev.expo.app', device } as const;
    jest.mocked(getInstalledFingerprintIosAsync).mockResolvedValue(installed);
    jest.mocked(getInstalledFingerprintAndroidAsync).mockResolvedValue(installed);
    const result = await checkNeedsRebuildAsync(projectRoot, ['android', 'ios'], {
      explicit: true,
    });
    // `--unstable-rebundle` deletes the embedded fingerprint (see runIosAsync), so it belongs
    // in the causes the developer checks. The flag does not exist for `expo run:android`.
    expect(result.platforms.ios!.recommendation).toContain('--unstable-rebundle');
    expect(result.platforms.android!.recommendation).not.toContain('--unstable-rebundle');
  });

  it.each([
    {
      name: 'ignores an unreachable platform when another one is definitive',
      ios: 'old-hash',
      android: null,
      explicit: false,
      exitCode: 2,
    },
    {
      name: 'counts an unreachable platform when the platforms are explicit',
      ios: 'current-hash',
      android: null,
      explicit: true,
      exitCode: 4,
    },
    {
      name: 'cannot determine when no platform is reachable',
      ios: null,
      android: null,
      explicit: false,
      exitCode: 4,
    },
  ])(`$name`, async ({ ios, android, explicit, exitCode }) => {
    mockInstalled(ios, 'ios');
    mockInstalled(android, 'android');
    const result = await checkNeedsRebuildAsync(projectRoot, ['android', 'ios'], { explicit });
    expect(result.exitCode).toBe(exitCode);
  });

  it(`ignores a silent phone (no-response) when another platform is definitive`, async () => {
    // A phone that happens to be plugged into the machine must not flip an implicit check
    // from 0 to 4 when Android answered cleanly.
    jest
      .mocked(getInstalledFingerprintIosAsync)
      .mockResolvedValue({ status: 'no-response', appId: 'dev.expo.app', device } as any);
    mockInstalled('current-hash', 'android');
    const result = await checkNeedsRebuildAsync(projectRoot, ['android', 'ios'], {
      explicit: false,
    });
    expect(result.platforms.ios?.exitCode).toBe(4);
    expect(result.exitCode).toBe(0);
  });

  it(`reports each platform as it completes`, async () => {
    mockInstalled('old-hash', 'ios');
    const seen: string[] = [];
    await checkNeedsRebuildAsync(projectRoot, ['android', 'ios'], {
      explicit: true,
      onPlatformResult: (platform, result) => seen.push(`${platform}:${result.reason}`),
    });
    expect(seen.sort()).toEqual(['android:hash-match', 'ios:hash-mismatch']);
  });

  it(`aggregates the worst exit code (prebuild-stale over rebuild)`, async () => {
    jest
      .mocked(getNativeDirectoryStaleness)
      .mockImplementation((_root, platform) =>
        platform === 'ios'
          ? { status: 'stale', changes: [] }
          : { status: 'not-applicable', changes: [] }
      );
    mockInstalled('old-hash', 'android');
    const result = await checkNeedsRebuildAsync(projectRoot, ['android', 'ios'], {
      explicit: true,
    });
    expect(result.platforms.android?.exitCode).toBe(2);
    expect(result.platforms.ios?.exitCode).toBe(3);
    expect(result.exitCode).toBe(3);
  });
});

describe(needsRebuildAsync, () => {
  it(`loads the project env before computing the fingerprint`, async () => {
    const originalExitCode = process.exitCode;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      jest.mocked(getConfigEnvMode).mockReturnValue('development');
      await needsRebuildAsync(projectRoot, { platform: 'android', json: true });
      expect(loadEnvFiles).toHaveBeenCalledWith(projectRoot, {
        mode: 'development',
        silent: true,
      });
    } finally {
      logSpy.mockRestore();
      process.exitCode = originalExitCode;
    }
  });

  it(`rejects with a CommandError on invalid usage`, async () => {
    await expect(needsRebuildAsync(projectRoot, { platform: 'web' })).rejects.toThrow(
      /Unsupported platform: web/
    );
    // Application IDs are platform-specific, so `--app-id` needs a single `--platform`.
    await expect(needsRebuildAsync(projectRoot, { appId: 'dev.expo.flavor' })).rejects.toThrow(
      /--platform/
    );
  });

  it(`passes the device and app id through to the readers`, async () => {
    const originalExitCode = process.exitCode;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await needsRebuildAsync(projectRoot, {
        platform: 'android',
        device: 'UDID-1',
        appId: 'dev.expo.flavor',
        json: true,
      });
      expect(getInstalledFingerprintAndroidAsync).toHaveBeenCalledWith(projectRoot, {
        expectedHash: expect.any(Promise),
        device: 'UDID-1',
        appId: 'dev.expo.flavor',
      });
    } finally {
      logSpy.mockRestore();
      process.exitCode = originalExitCode;
    }
  });
});
