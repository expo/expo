import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { openUrlOnDeviceAsync } from '../deepLink';

/**
 * Covers `openUrlOnDeviceAsync` with the process spawn mocked, so the argv the device command
 * receives is asserted without a device.
 */

interface FakeChild extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
}

function mockSpawn(): FakeChild {
  const child = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  });
  jest.mocked(spawn).mockReturnValue(child as any);
  return child;
}

function spawnedArgv(): string[] {
  const [bin, args] = jest.mocked(spawn).mock.calls[0] as unknown as [string, string[]];
  return [bin, ...args];
}

describe(openUrlOnDeviceAsync, () => {
  it(`should spawn simctl openurl on iOS`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'ios',
      deviceId: 'ABCD-1234',
      url: 'demoapp://profile/42',
      appId: 'com.example.demo',
    });
    child.emit('close', 0, null);
    const result = await promise;

    expect(spawnedArgv()).toEqual([
      'xcrun',
      'simctl',
      'openurl',
      'ABCD-1234',
      'demoapp://profile/42',
    ]);
    expect(result.command).toBe('xcrun simctl openurl ABCD-1234 demoapp://profile/42');
    expect(result.exitCode).toBe(0);
  });

  it(`should spawn an adb ACTION_VIEW intent on Android`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'android',
      deviceId: 'emulator-5554',
      url: 'exp://localhost:8081/--/profile/42',
      appId: 'host.exp.exponent',
    });
    child.emit('close', 0, null);
    const result = await promise;

    expect(spawnedArgv()).toEqual([
      'adb',
      '-s',
      'emulator-5554',
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.VIEW',
      '-c',
      'android.intent.category.BROWSABLE',
      '-d',
      `'exp://localhost:8081/--/profile/42'`,
      'host.exp.exponent',
    ]);
    expect(result.exitCode).toBe(0);
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server — F123, and the
  // one thing about the Android launcher open that is not a matter of which URL is sent.
  //
  // A BROWSABLE ACTION_VIEW intent carrying the dev launcher's URL reaches `DevLauncherController.
  // handleIntent` on an app that is **not running**, and that path dies:
  // `java.lang.NullPointerException … DevLauncherController.createAppIntent` on
  // `expo-dev-launcher`, leaving the app on `DevLauncherErrorActivity`
  // [observed — 2026-08-28, the emulator of `live-devclient`, and again in wave 29's
  // `evidence/63-devlauncher-npe.txt`]. The same URL handed to `MainActivity` **by component**
  // loads the bundle and attaches in about three seconds, on the same device in the same minute.
  //
  // That is exactly what `expo start --dev-client --android` does, and this is its command:
  // `am start -f 0x20000000 -n <app>/.MainActivity -d <url>`
  // [reference — `@expo/cli` `src/start/platforms/android/adb.ts` §launchActivityAsync].
  it(`should launch a named activity by component, the way the Expo CLI opens a dev client`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'android',
      deviceId: 'emulator-5554',
      url: 'demoapp://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081',
      launchActivity: 'com.example.demo/.MainActivity',
    });
    child.emit('close', 0, null);
    await promise;

    expect(spawnedArgv()).toEqual([
      'adb',
      '-s',
      'emulator-5554',
      'shell',
      'am',
      'start',
      // FLAG_ACTIVITY_SINGLE_TOP, so an app already at the top of the stack is not relaunched.
      '-f',
      '0x20000000',
      '-n',
      'com.example.demo/.MainActivity',
      '-d',
      `'demoapp://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'`,
    ]);
  });

  // iOS has one way in — `simctl openurl` — and it is what the Expo CLI uses there too.
  it(`should ignore a launch activity on iOS`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'ios',
      deviceId: 'SIM-1',
      url: 'demoapp://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081',
      launchActivity: 'com.example.demo/.MainActivity',
    });
    child.emit('close', 0, null);
    await promise;

    expect(spawnedArgv()[1]).toBe('simctl');
  });

  it(`should report a failing device command instead of throwing`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'android',
      deviceId: 'emulator-5554',
      url: 'demoapp://profile/42',
    });
    child.stderr.emit('data', 'Error: Activity not started');
    child.emit('close', 1, null);
    const result = await promise;

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe('Error: Activity not started');
  });

  it(`should return the device output`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'android',
      deviceId: 'emulator-5554',
      url: 'demoapp://profile/42',
    });
    child.stdout.emit('data', 'Starting: Intent { act=android.intent.action.VIEW }');
    child.emit('close', 0, null);
    const result = await promise;

    expect(result.stdout).toContain('Starting: Intent');
  });

  it(`should report an adb that could not be started as a tool failure, not a device failure`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'android',
      deviceId: 'emulator-5554',
      url: 'demoapp://profile/42',
    });
    child.emit('error', Object.assign(new Error('spawn adb ENOENT'), { code: 'ENOENT' }));

    const error = await promise.catch((e) => e);

    // One error for an unrunnable `adb` wherever it is spawned from (`src/device/adb.ts`, F49):
    // it names every place that was looked and the variable that adds another.
    expect(error.code).toBe('ADB_NOT_RUNNABLE');
    expect(error.message).toContain('"adb" could not be run');
    expect(error.message).toContain('ANDROID_HOME');
  });

  it(`should report a missing simctl with an install hint`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'ios',
      deviceId: 'SIM-1',
      url: 'demoapp://profile/42',
    });
    child.emit('error', Object.assign(new Error('spawn xcrun ENOENT'), { code: 'ENOENT' }));

    const error = await promise.catch((e) => e);

    expect(error.code).toBe('DEVICE_TOOL_MISSING');
    expect(error.message).toContain('xcrun simctl');
  });
});
