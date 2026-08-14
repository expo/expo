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
  it(`exits 0 when the installed hash matches`, async () => {
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'up-to-date',
      reason: 'hash-match',
      installedHash: 'current-hash',
      currentHash: 'current-hash',
      exitCode: 0,
    });
    expect(result.exitCode).toBe(0);
    // The expected hash is passed as a promise so the device read overlaps the fingerprint.
    expect(getInstalledFingerprintIosAsync).toHaveBeenCalledWith(projectRoot, {
      expectedHash: expect.any(Promise),
    });
    await expect(
      jest.mocked(getInstalledFingerprintIosAsync).mock.calls[0]![1].expectedHash
    ).resolves.toBe('current-hash');
  });

  it(`exits 1 when the installed hash differs`, async () => {
    mockInstalled('old-hash', 'ios');
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'rebuild-required',
      reason: 'hash-mismatch',
      commands: ['npx expo run:ios'],
      exitCode: 1,
    });
    expect(result.exitCode).toBe(1);
  });

  it(`exits 2 when the prebuild marker is stale, without waiting for a device`, async () => {
    jest.mocked(getNativeDirectoryStaleness).mockReturnValue({
      status: 'stale',
      changes: [
        { source: 'app config', change: 'changed' },
        { source: 'plugins/withFoo.js', change: 'added' },
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
      exitCode: 2,
    });
    // The verdict names what changed, so the developer (or agent) can act without guessing.
    expect(result.platforms.ios!.recommendation).toContain('app config, plugins/withFoo.js');
    expect(result.platforms.ios!.prebuildChanges).toEqual([
      { source: 'app config', change: 'changed' },
      { source: 'plugins/withFoo.js', change: 'added' },
    ]);
    expect(result.exitCode).toBe(2);
  });

  it(`exits 3 when @expo/fingerprint is unavailable`, async () => {
    jest.mocked(importFingerprint).mockReturnValue(null);
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'unknown',
      reason: 'fingerprint-unavailable',
      exitCode: 3,
    });
    expect(result.exitCode).toBe(3);
  });

  it(`exits 3 when the app is not installed`, async () => {
    jest.mocked(getInstalledFingerprintIosAsync).mockResolvedValue({
      status: 'app-not-installed',
      appId: 'dev.expo.app',
      device,
    });
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'unknown',
      reason: 'app-not-installed',
      commands: ['npx expo run:ios'],
      exitCode: 3,
    });
  });

  it(`exits 3 when the device check fails unexpectedly`, async () => {
    jest
      .mocked(getInstalledFingerprintIosAsync)
      .mockRejectedValue(new Error('adb: device offline'));
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'unknown',
      reason: 'check-failed',
      exitCode: 3,
    });
    expect(result.platforms.ios?.recommendation).toContain('adb: device offline');
    expect(result.exitCode).toBe(3);
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
      expect(result.platforms.ios).toMatchObject({ reason: 'check-failed', exitCode: 3 });

      // Let any pending rejection reach the process listener before asserting.
      await new Promise(setImmediate);
      expect(unhandled).toEqual([]);
    } finally {
      process.off('unhandledRejection', listener);
    }
  });

  it(`exits 3 when the installed app has no embedded fingerprint`, async () => {
    jest.mocked(getInstalledFingerprintIosAsync).mockResolvedValue({
      status: 'no-embedded-fingerprint',
      appId: 'dev.expo.app',
      device,
    });
    const result = await checkNeedsRebuildAsync(projectRoot, ['ios'], {
      explicit: true,
    });
    expect(result.platforms.ios).toMatchObject({
      status: 'unknown',
      reason: 'no-embedded-fingerprint',
      exitCode: 3,
    });
  });

  it(`ignores unreachable platforms by default when another platform is definitive`, async () => {
    mockInstalled('old-hash', 'ios');
    mockInstalled(null, 'android');
    const result = await checkNeedsRebuildAsync(projectRoot, ['android', 'ios'], {
      explicit: false,
    });
    expect(result.platforms.android).toMatchObject({
      reason: 'no-device',
      exitCode: 3,
    });
    expect(result.exitCode).toBe(1);
  });

  it(`counts unreachable platforms when requested explicitly`, async () => {
    mockInstalled(null, 'android');
    const result = await checkNeedsRebuildAsync(projectRoot, ['android', 'ios'], {
      explicit: true,
    });
    expect(result.exitCode).toBe(3);
  });

  it(`exits 3 when no platform is reachable`, async () => {
    mockInstalled(null, 'ios');
    mockInstalled(null, 'android');
    const result = await checkNeedsRebuildAsync(projectRoot, ['android', 'ios'], {
      explicit: false,
    });
    expect(result.exitCode).toBe(3);
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
    expect(result.platforms.android?.exitCode).toBe(1);
    expect(result.platforms.ios?.exitCode).toBe(2);
    expect(result.exitCode).toBe(2);
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

  it(`rejects with a CommandError on an unsupported platform`, async () => {
    await expect(needsRebuildAsync(projectRoot, { platform: 'web' })).rejects.toThrow(
      /Unsupported platform: web/
    );
  });

  it(`requires --platform when --app-id is used`, async () => {
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
