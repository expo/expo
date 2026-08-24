import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { buildStopAppCommand, looksLikeNotRunning, stopAppOnDeviceAsync } from '../device';

/** Answer the next `spawn` with a fixed result. */
function mockSpawn({
  stdout = '',
  stderr = '',
  exitCode = 0,
}: {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}) {
  jest.mocked(spawn).mockImplementation((() => {
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });
    process.nextTick(() => {
      if (stdout) child.stdout.emit('data', stdout);
      if (stderr) child.stderr.emit('data', stderr);
      child.emit('close', exitCode, null);
    });
    return child as any;
  }) as any);
}

describe(buildStopAppCommand, () => {
  it(`should terminate the app on an iOS simulator`, () => {
    expect(
      buildStopAppCommand({ platform: 'ios', deviceId: 'UDID', appId: 'host.exp.Exponent' }).display
    ).toBe('xcrun simctl terminate UDID host.exp.Exponent');
  });

  it(`should force-stop the app on an Android device`, () => {
    expect(
      buildStopAppCommand({
        platform: 'android',
        deviceId: 'emulator-5554',
        appId: 'host.exp.exponent',
      }).display
    ).toBe('adb -s emulator-5554 shell am force-stop host.exp.exponent');
  });
});

describe(stopAppOnDeviceAsync, () => {
  const params = { platform: 'ios' as const, deviceId: 'UDID', appId: 'host.exp.Exponent' };

  it(`should report the app stopped`, async () => {
    mockSpawn({ exitCode: 0 });
    await expect(stopAppOnDeviceAsync(params)).resolves.toMatchObject({ ok: true, reason: null });
  });

  // `simctl terminate` exits non-zero for an app that was not running, which is the state this
  // command exists to reach. Reading it as a failure would abandon a reload that had already won.
  it(`should treat "it was not running" as the state it was aiming for`, async () => {
    mockSpawn({
      exitCode: 4,
      stderr:
        'An error was encountered processing the command (domain=FBSOpenApplicationServiceErrorDomain, code=4):\nfound nothing to terminate',
    });
    await expect(stopAppOnDeviceAsync(params)).resolves.toMatchObject({ ok: true });
  });

  it(`should report a device tool that failed for another reason`, async () => {
    mockSpawn({ exitCode: 1, stderr: 'Invalid device: NOPE' });
    await expect(stopAppOnDeviceAsync(params)).resolves.toMatchObject({
      ok: false,
      reason: 'Invalid device: NOPE',
    });
  });
});

describe(looksLikeNotRunning, () => {
  it.each([
    'found nothing to terminate',
    'FBSOpenApplicationServiceErrorDomain, code=4',
    'Error: app is not running',
  ])(`should recognize %s`, (output) => {
    expect(looksLikeNotRunning(output)).toBe(true);
  });

  it(`should not recognize an unrelated failure`, () => {
    expect(looksLikeNotRunning('Invalid device: NOPE')).toBe(false);
  });
});
