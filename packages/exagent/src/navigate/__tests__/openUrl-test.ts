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

  it(`should report a missing device tool with an install hint`, async () => {
    const child = mockSpawn();

    const promise = openUrlOnDeviceAsync({
      platform: 'android',
      deviceId: 'emulator-5554',
      url: 'demoapp://profile/42',
    });
    child.emit('error', Object.assign(new Error('spawn adb ENOENT'), { code: 'ENOENT' }));

    const error = await promise.catch((e) => e);

    expect(error.code).toBe('DEVICE_TOOL_MISSING');
    expect(error.message).toContain('adb');
  });
});
