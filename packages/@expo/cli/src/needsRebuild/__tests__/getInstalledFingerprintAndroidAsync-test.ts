import { vol } from 'memfs';
import path from 'path';

import { AndroidAppIdResolver } from '../../start/platforms/android/AndroidAppIdResolver';
import {
  getAttachedDevicesAsync,
  getPackagePathsAsync,
  getServer,
} from '../../start/platforms/android/adb';
import { getInstalledFingerprintAndroidAsync } from '../getInstalledFingerprintAndroidAsync';

jest.mock('../../start/platforms/android/adb', () => {
  const actual = jest.requireActual('../../start/platforms/android/adb');
  return {
    adbArgs: actual.adbArgs,
    adbShellArgs: actual.adbShellArgs,
    shellQuote: actual.shellQuote,
    getAttachedDevicesAsync: jest.fn(),
    getPackagePathsAsync: jest.fn(),
    getServer: jest.fn(),
  };
});
jest.mock('../../start/platforms/android/AndroidAppIdResolver');

const realFs: typeof import('fs') = jest.requireActual('fs');

const projectRoot = '/app';
const device = {
  name: 'Pixel_8',
  pid: 'emulator-5554',
  isAuthorized: true,
} as any;

function loadApkFixture(): Buffer {
  return realFs.readFileSync(
    path.join(__dirname, '..', '..', 'utils', '__tests__', 'fixtures', 'zip', 'fixture-stored.zip')
  );
}

/** A valid zip archive with zero entries (just an end-of-central-directory record). */
function makeEmptyZip(): Buffer {
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  return eocd;
}

/**
 * Fake adb server backed by in-memory APKs per device pid: answers `stat` with the size,
 * `dd` ranges with slices, and `pull` by writing the file — like a real device would.
 */
function mockAdbServer(apkByPid: Record<string, Buffer>, { rangedReads = true } = {}) {
  const apkFor = (args: string[]) => {
    const pid = args[args.indexOf('-s') + 1]!;
    return apkByPid[pid]!;
  };
  const runAsync = jest.fn(async (args: string[]) => {
    const joined = args.join(' ');
    if (joined.includes("'stat'")) {
      return `${apkFor(args).length}\n`;
    }
    if (args.includes('pull')) {
      vol.writeFileSync(args[args.length - 1]!, apkFor(args));
      return '';
    }
    throw new Error(`Unexpected adb command: ${joined}`);
  });
  const runRawAsync = jest.fn(async (args: string[]) => {
    if (!rangedReads) {
      throw new Error('/system/bin/sh: dd: not found');
    }
    // The dd invocation is a single shell-command argument.
    const command = args[args.length - 1]!;
    const numeric = (name: string) =>
      parseInt(command.match(new RegExp(`${name}=(\\d+)`))![1]!, 10);
    const blockSize = numeric('bs');
    const skip = numeric('skip');
    const count = numeric('count');
    return apkFor(args).subarray(blockSize * skip, blockSize * (skip + count));
  });
  jest.mocked(getServer).mockReturnValue({ runAsync, runRawAsync } as any);
  return { runAsync, runRawAsync };
}

beforeEach(() => {
  vol.reset();
  // The pull fallback creates its temporary directory under os.tmpdir() (mocked to `/tmp`).
  vol.fromJSON({ '/tmp/.keep': '' });
  jest.mocked(getAttachedDevicesAsync).mockResolvedValue([device]);
  jest.mocked(AndroidAppIdResolver).mockImplementation(
    () =>
      ({
        getAppIdAsync: jest.fn(async () => 'dev.expo.app'),
      }) as any
  );
  jest.mocked(getPackagePathsAsync).mockResolvedValue(['/data/app/~~x/dev.expo.app/base.apk']);
  mockAdbServer({ 'emulator-5554': loadApkFixture() });
});

describe(getInstalledFingerprintAndroidAsync, () => {
  it(`returns no-device without an attached device`, async () => {
    jest.mocked(getAttachedDevicesAsync).mockResolvedValue([]);
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'x' })
    ).resolves.toEqual({ status: 'no-device' });
  });

  it(`ignores unauthorized devices`, async () => {
    jest
      .mocked(getAttachedDevicesAsync)
      .mockResolvedValue([{ ...device, isAuthorized: false } as any]);
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'x' })
    ).resolves.toEqual({ status: 'no-device' });
  });

  it(`returns app-not-installed when pm path finds nothing`, async () => {
    jest.mocked(getPackagePathsAsync).mockResolvedValue([]);
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'x' })
    ).resolves.toEqual({
      status: 'app-not-installed',
      appId: 'dev.expo.app',
      device: { name: 'Pixel_8', identifier: 'emulator-5554' },
    });
  });

  it(`reads the embedded fingerprint with ranged reads, without pulling the APK`, async () => {
    const { runAsync, runRawAsync } = mockAdbServer({ 'emulator-5554': loadApkFixture() });
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'test-fingerprint-hash' })
    ).resolves.toEqual({
      status: 'ok',
      hash: 'test-fingerprint-hash',
      appId: 'dev.expo.app',
      device: { name: 'Pixel_8', identifier: 'emulator-5554' },
    });
    expect(runRawAsync).toHaveBeenCalled();
    expect(runAsync).not.toHaveBeenCalledWith(expect.arrayContaining(['pull']));
  });

  it(`falls back to pulling the APK when ranged reads are unavailable`, async () => {
    const { runAsync } = mockAdbServer(
      { 'emulator-5554': loadApkFixture() },
      { rangedReads: false }
    );
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'test-fingerprint-hash' })
    ).resolves.toMatchObject({
      status: 'ok',
      hash: 'test-fingerprint-hash',
    });
    expect(runAsync).toHaveBeenCalledWith(expect.arrayContaining(['pull']));
  });

  it(`returns no-embedded-fingerprint when the asset is missing from the APK`, async () => {
    mockAdbServer({ 'emulator-5554': makeEmptyZip() });
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'x' })
    ).resolves.toMatchObject({
      status: 'no-embedded-fingerprint',
    });
  });

  it(`skips an offline device when another device can answer`, async () => {
    const offlineDevice = { name: 'Pixel_9', pid: 'emulator-5556', isAuthorized: true } as any;
    jest.mocked(getAttachedDevicesAsync).mockResolvedValue([offlineDevice, device]);
    jest.mocked(getPackagePathsAsync).mockImplementation(async (target: any) => {
      if (target.pid === 'emulator-5556') {
        throw new Error('error: device offline');
      }
      return ['/data/app/~~x/dev.expo.app/base.apk'];
    });
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'test-fingerprint-hash' })
    ).resolves.toMatchObject({
      status: 'ok',
      hash: 'test-fingerprint-hash',
      device: { name: 'Pixel_8', identifier: 'emulator-5554' },
    });
  });

  it(`throws when every device is unreachable`, async () => {
    jest.mocked(getPackagePathsAsync).mockRejectedValue(new Error('error: device offline'));
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'x' })
    ).rejects.toThrow(/device offline/);
  });

  describe('targeting options', () => {
    const deviceB = { name: 'Pixel_9', pid: 'emulator-5556', isAuthorized: true } as any;

    it.each([
      ['serial', 'emulator-5556'],
      ['name', 'Pixel_9'],
      // Case-insensitive, like `expo run:android --device`.
      ['uppercase serial', 'EMULATOR-5556'],
      ['differently cased name', 'pixel_9'],
    ])(`checks only the device matching --device by %s`, async (_kind, deviceFilter) => {
      jest.mocked(getAttachedDevicesAsync).mockResolvedValue([deviceB, device]);
      mockAdbServer({ 'emulator-5556': makeEmptyZip(), 'emulator-5554': loadApkFixture() });
      await expect(
        getInstalledFingerprintAndroidAsync(projectRoot, {
          expectedHash: 'x',
          device: deviceFilter,
        })
      ).resolves.toMatchObject({
        status: 'no-embedded-fingerprint',
        device: { identifier: 'emulator-5556' },
      });
    });

    it(`returns no-device when --device matches nothing`, async () => {
      await expect(
        getInstalledFingerprintAndroidAsync(projectRoot, {
          expectedHash: 'x',
          device: 'Pixel_99',
        })
      ).resolves.toEqual({ status: 'no-device' });
    });

    it(`uses --app-id instead of resolving the package name`, async () => {
      await expect(
        getInstalledFingerprintAndroidAsync(projectRoot, {
          expectedHash: 'test-fingerprint-hash',
          appId: 'dev.expo.flavor',
        })
      ).resolves.toMatchObject({ status: 'ok', appId: 'dev.expo.flavor' });
      expect(AndroidAppIdResolver).not.toHaveBeenCalled();
      expect(getPackagePathsAsync).toHaveBeenCalledWith(expect.anything(), {
        appId: 'dev.expo.flavor',
      });
    });
  });

  it(`prefers the device whose app matches the expected hash`, async () => {
    const deviceB = { name: 'Pixel_9', pid: 'emulator-5556', isAuthorized: true } as any;
    jest.mocked(getAttachedDevicesAsync).mockResolvedValue([deviceB, device]);
    // The first device (emulator-5556) has an app without the fingerprint asset.
    mockAdbServer({
      'emulator-5556': makeEmptyZip(),
      'emulator-5554': loadApkFixture(),
    });
    await expect(
      getInstalledFingerprintAndroidAsync(projectRoot, { expectedHash: 'test-fingerprint-hash' })
    ).resolves.toEqual({
      status: 'ok',
      hash: 'test-fingerprint-hash',
      appId: 'dev.expo.app',
      device: { name: 'Pixel_8', identifier: 'emulator-5554' },
    });
  });
});
