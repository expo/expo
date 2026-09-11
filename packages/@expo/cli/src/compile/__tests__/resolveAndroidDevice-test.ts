import spawnAsync from '@expo/spawn-async';
import path from 'path';

import type { Device } from '../../start/platforms/android/adb';
import {
  DeviceABI,
  getAttachedDevicesAsync,
  getDeviceABIsAsync,
} from '../../start/platforms/android/adb';
import { assertAndroidArtifactAbisAsync, resolveAndroidDeviceAsync } from '../resolveAndroidDevice';

jest.mock('../../start/platforms/android/adb', () => ({
  DeviceABI: jest.requireActual('../../start/platforms/android/adb').DeviceABI,
  getAttachedDevicesAsync: jest.fn(),
  getDeviceABIsAsync: jest.fn(),
}));

const originalPlatform = process.platform;

const device: Device = {
  pid: 'emulator-5554',
  name: 'Pixel',
  type: 'emulator',
  isAuthorized: true,
  isBooted: true,
  state: 'device',
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.replaceProperty(process, 'env', { ...process.env, JAVA_HOME: '/test jdk' });
  Object.defineProperty(process, 'platform', { value: 'darwin' });
  jest.mocked(getAttachedDevicesAsync).mockResolvedValue([device]);
  jest.mocked(getDeviceABIsAsync).mockResolvedValue([DeviceABI.arm64v8a]);
});

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform });
  jest.restoreAllMocks();
});

describe(resolveAndroidDeviceAsync, () => {
  it('uses the only ready attached device without waiting for or booting one', async () => {
    await expect(resolveAndroidDeviceAsync('generic')).resolves.toEqual(['arm64-v8a']);
    expect(getAttachedDevicesAsync).toHaveBeenCalledWith();
    expect(getDeviceABIsAsync).toHaveBeenCalledWith(device);
  });

  it.each(['emulator-5556', '192.168.1.2:5555', 'adb-A_B.C._adb-tls-connect._tcp'])(
    'matches the exact serial %s without altering punctuation',
    async (pid) => {
      const selected = { ...device, pid };
      jest.mocked(getAttachedDevicesAsync).mockResolvedValue([device, selected]);
      await expect(resolveAndroidDeviceAsync(pid)).resolves.toEqual(['arm64-v8a']);
      expect(getDeviceABIsAsync).toHaveBeenCalledWith(selected);
    }
  );

  it.each(['offline', 'unauthorized', 'recovery', 'bootloader', undefined])(
    'ignores an attached device in the %s state when selecting a generic device',
    async (state) => {
      jest
        .mocked(getAttachedDevicesAsync)
        .mockResolvedValue([{ ...device, pid: 'unready', state }, device]);
      await expect(resolveAndroidDeviceAsync('generic')).resolves.toEqual(['arm64-v8a']);
      expect(getDeviceABIsAsync).toHaveBeenCalledWith(device);
    }
  );

  const unavailableDeviceLists: Device[][] = [
    [],
    [{ ...device, isAuthorized: false }],
    [{ ...device, state: 'offline' }],
    [{ ...device, pid: undefined }],
    [{ ...device, pid: '' }],
  ];
  it.each(unavailableDeviceLists.map((devices) => ({ devices })))(
    'rejects a generic selection with no ready authorized device: $devices',
    async ({ devices }) => {
      jest.mocked(getAttachedDevicesAsync).mockResolvedValue(devices);
      await expect(resolveAndroidDeviceAsync('generic')).rejects.toThrow('Found 0');
      expect(getDeviceABIsAsync).not.toHaveBeenCalled();
    }
  );

  it('requires an explicit serial when multiple ready devices are attached', async () => {
    jest
      .mocked(getAttachedDevicesAsync)
      .mockResolvedValue([device, { ...device, pid: 'emulator-5556' }]);
    await expect(resolveAndroidDeviceAsync('generic')).rejects.toThrow('Found 2');
    expect(getDeviceABIsAsync).not.toHaveBeenCalled();
  });

  it.each(['Pixel', 'emulator', 'EMULATOR-5554', 'missing'])(
    'does not match names, partial serials, or different case: %s',
    async (serial) => {
      await expect(resolveAndroidDeviceAsync(serial)).rejects.toThrow(`Android device "${serial}"`);
      expect(getDeviceABIsAsync).not.toHaveBeenCalled();
    }
  );

  it.each([
    { ...device, state: 'offline' },
    { ...device, state: 'unauthorized', isAuthorized: false },
    { ...device, state: 'device', isAuthorized: false },
  ])('rejects an unavailable explicitly selected device: %j', async (selected) => {
    jest
      .mocked(getAttachedDevicesAsync)
      .mockResolvedValue([selected, { ...device, pid: 'other-ready-device' }]);
    await expect(resolveAndroidDeviceAsync('emulator-5554')).rejects.toThrow(
      'must match exactly one attached, authorized device'
    );
    expect(getDeviceABIsAsync).not.toHaveBeenCalled();
  });

  it('deduplicates supported ABIs without changing device preference', async () => {
    jest
      .mocked(getDeviceABIsAsync)
      .mockResolvedValue([
        DeviceABI.armeabi,
        DeviceABI.x8664,
        DeviceABI.arm64v8a,
        DeviceABI.x8664,
        DeviceABI.universal,
        DeviceABI.armeabiV7a,
        DeviceABI.x86,
      ]);
    await expect(resolveAndroidDeviceAsync('generic')).resolves.toEqual([
      'x86_64',
      'arm64-v8a',
      'armeabi-v7a',
      'x86',
    ]);
  });

  it.each([[], [DeviceABI.arm, DeviceABI.arm64, DeviceABI.universal]].map((abis) => ({ abis })))(
    'rejects devices with no supported ABI: $abis',
    async ({ abis }) => {
      jest.mocked(getDeviceABIsAsync).mockResolvedValue(abis);
      await expect(resolveAndroidDeviceAsync('generic')).rejects.toThrow('has no supported ABIs');
    }
  );

  it('preserves device discovery failures', async () => {
    const error = new Error('ADB is unavailable');
    jest.mocked(getAttachedDevicesAsync).mockRejectedValue(error);
    await expect(resolveAndroidDeviceAsync('generic')).rejects.toBe(error);
    expect(getDeviceABIsAsync).not.toHaveBeenCalled();
  });

  it('preserves ABI query failures', async () => {
    const error = new Error('Device disconnected');
    jest.mocked(getDeviceABIsAsync).mockRejectedValue(error);
    await expect(resolveAndroidDeviceAsync('generic')).rejects.toBe(error);
  });
});

function mockJarListing(stdout: string) {
  jest.mocked(spawnAsync).mockResolvedValueOnce({
    pid: 1,
    status: 0,
    signal: null,
    stdout,
    stderr: '',
    output: [stdout, ''],
  });
}

describe(assertAndroidArtifactAbisAsync, () => {
  it('accepts an APK with a matching native ABI and captures jar output', async () => {
    mockJarListing('lib/x86/libother.so\r\nlib/arm64-v8a/libapp.so\r\n');
    await expect(
      assertAndroidArtifactAbisAsync(['/artifacts/app & tools.apk'], ['arm64-v8a'])
    ).resolves.toBeUndefined();
    expect(spawnAsync).toHaveBeenCalledWith(
      '/test jdk/bin/jar',
      ['--list', '--file', '/artifacts/app & tools.apk'],
      { stdio: 'pipe' }
    );
  });

  it.each([
    'AndroidManifest.xml\nclasses.dex\n',
    'assets/lib/x86/libapp.so\nlib/x86/metadata.txt\nlib/x86/nested/library.so\n',
  ])('accepts APKs without native libraries at Android ABI paths', async (listing) => {
    mockJarListing(listing);
    await expect(
      assertAndroidArtifactAbisAsync(['/app.apk'], ['arm64-v8a'])
    ).resolves.toBeUndefined();
  });

  it.each(['x86', 'mips'])(
    'rejects an APK containing only incompatible %s libraries',
    async (abi) => {
      mockJarListing(`lib/${abi}/libapp.so\n`);
      await expect(
        assertAndroidArtifactAbisAsync(['/incompatible.apk'], ['arm64-v8a'])
      ).rejects.toThrow(
        `Android artifact "/incompatible.apk" contains native libraries for ${abi}, but the device supports arm64-v8a.`
      );
    }
  );

  it('checks each APK instead of accepting a matching ABI in another artifact', async () => {
    mockJarListing('lib/arm64-v8a/libapp.so\n');
    mockJarListing('lib/x86/libapp.so\n');
    await expect(
      assertAndroidArtifactAbisAsync(['/matching.apk', '/incompatible.apk'], ['arm64-v8a'])
    ).rejects.toThrow('Android artifact "/incompatible.apk"');
    expect(spawnAsync).toHaveBeenCalledTimes(2);
  });

  it('accepts multiple neutral and compatible artifacts', async () => {
    mockJarListing('classes.dex\n');
    mockJarListing('lib/x86_64/libapp.so\n');
    await expect(
      assertAndroidArtifactAbisAsync(['/neutral.apk', '/matching.apk'], ['arm64-v8a', 'x86_64'])
    ).resolves.toBeUndefined();
    expect(spawnAsync).toHaveBeenCalledTimes(2);
  });

  it('uses jar from PATH when JAVA_HOME is unset', async () => {
    delete process.env.JAVA_HOME;
    mockJarListing('classes.dex\n');
    await assertAndroidArtifactAbisAsync(['/app.apk'], ['arm64-v8a']);
    expect(spawnAsync).toHaveBeenCalledWith('jar', ['--list', '--file', '/app.apk'], {
      stdio: 'pipe',
    });
  });

  it('uses jar.exe on Windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    mockJarListing('classes.dex\n');
    await assertAndroidArtifactAbisAsync(['/app.apk'], ['arm64-v8a']);
    expect(spawnAsync).toHaveBeenCalledWith(
      path.join('/test jdk', 'bin', 'jar.exe'),
      ['--list', '--file', '/app.apk'],
      { stdio: 'pipe' }
    );
  });

  it('reports the artifact and preserves the cause when jar fails', async () => {
    const cause = new Error('Invalid ZIP header');
    jest.mocked(spawnAsync).mockRejectedValueOnce(cause);
    await expect(
      assertAndroidArtifactAbisAsync(['/broken.apk'], ['arm64-v8a'])
    ).rejects.toMatchObject({
      code: 'ANDROID_ARTIFACT',
      message:
        'Cannot inspect Android artifact "/broken.apk" with /test jdk/bin/jar: Invalid ZIP header',
      cause,
    });
  });
});
