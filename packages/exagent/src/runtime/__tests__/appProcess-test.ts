import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { vol } from 'memfs';

import { buildStopAppCommand, looksLikeNotRunning, stopAppOnDeviceAsync } from '../appProcess';

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

// @ref llp/0005-runtime-loop-tools.rfc.md §What the cloud backend can and cannot do
describe('stopping the app on a cloud simulator session', () => {
  afterEach(() => vol.reset());

  /** A project with an `eas` to spawn, so the resolver never reaches this machine's PATH. */
  function cloudProject(): void {
    vol.fromJSON({
      '/project/package.json': '{}',
      '/project/node_modules/.bin/eas': '#!/bin/sh\n',
    });
  }

  const cloudParams = {
    platform: 'ios' as const,
    deviceId: 'sess-1',
    appId: 'host.exp.Exponent',
    backend: 'cloud' as const,
    projectRoot: '/project',
  };

  // The named app, and nothing that would stop the billed machine.
  it(`closes the named app through the session controller`, () => {
    const command = buildStopAppCommand(cloudParams);

    expect(command.display).toBe(
      'eas simulator:exec npx agent-device@latest close host.exp.Exponent'
    );
    expect(command.display).not.toContain('--shutdown');
    expect(command.display).not.toContain('simctl');
    expect(command.display).not.toContain('adb');
  });

  it(`reports the app as stopped when the controller closed it`, async () => {
    cloudProject();
    mockSpawn({ stdout: 'closed' });

    await expect(stopAppOnDeviceAsync(cloudParams)).resolves.toMatchObject({
      ok: true,
      wasAlreadyStopped: false,
      reason: null,
    });
  });

  it(`reads "it was not running" as the state the caller wanted`, async () => {
    cloudProject();
    mockSpawn({ exitCode: 1, stderr: 'no such app is running' });

    await expect(stopAppOnDeviceAsync(cloudParams)).resolves.toMatchObject({
      ok: true,
      wasAlreadyStopped: true,
    });
  });

  // A `simulator:exec` that failed for any other reason is not the device answering about the app,
  // so it is a failure with what the tool printed in it (llp/0005 §A non-zero exit means different
  // things per backend).
  it(`reports anything else as a failure, with what the tool printed`, async () => {
    cloudProject();
    mockSpawn({ exitCode: 1, stderr: 'Remote daemon is unavailable' });

    await expect(stopAppOnDeviceAsync(cloudParams)).resolves.toMatchObject({
      ok: false,
      reason: 'Remote daemon is unavailable',
    });
  });

  it(`refuses rather than guessing when no project was named`, async () => {
    await expect(
      stopAppOnDeviceAsync({ ...cloudParams, projectRoot: undefined })
    ).resolves.toMatchObject({ ok: false, reason: expect.stringContaining('bug in this CLI') });
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
