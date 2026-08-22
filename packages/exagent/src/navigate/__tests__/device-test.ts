import { spawn } from 'child_process';
import { EventEmitter } from 'events';

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
      device: { platform: 'ios', deviceId: 'IOS-1', name: 'iPhone 17' },
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

    await expect(probeAndroidDeviceAsync()).resolves.toEqual({
      device: { platform: 'android', deviceId: 'emulator-5554' },
    });
    expect(spawn).toHaveBeenCalledWith('adb', ['devices'], expect.anything());
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
      platform: 'ios',
      deviceId: 'IOS-1',
      name: 'iPhone 17',
    });
  });

  it(`should explain how to boot a simulator when --ios finds none`, async () => {
    mockSpawnQueue([{ stdout: JSON.stringify({ devices: {} }) }]);

    const error = await resolveDeviceAsync('ios').catch((e) => e);

    expect(error.code).toBe('NO_IOS_DEVICE');
    expect(error.message).toContain('npx expo run:ios');
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
