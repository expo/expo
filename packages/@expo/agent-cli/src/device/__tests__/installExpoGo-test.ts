// @ref llp/0005-runtime-loop-tools.rfc.md §Putting Expo Go on a simulator that has not got it
//
// The gate used to refuse here and name `npx expo start --ios`, which is a correct instruction and
// a dead end for an agent loop: the loop cannot take it without leaving the loop. So the missing
// app is now installed, and this is the pair of subprocesses that does it — `expo-go download` for
// the binary and `simctl install` for the device.
//
// Both are stubbed here. What is worth testing is the argv, the order, and every way the pair can
// fail: a download that answers no path, a `simctl` that refuses, a device that is not booted.

import { installExpoGoAsync } from '../installExpoGo';

/** A capture result, with the fields a caller reads. */
function captured(over: Partial<{ stdout: string; stderr: string; exitCode: number | null }> = {}) {
  return { stdout: '', stderr: '', exitCode: 0, ...over };
}

const DOWNLOADED = '{"path":"/tmp/dl/Expo-Go-57.0.9.tar.app"}';

describe(installExpoGoAsync, () => {
  it(`downloads the release for this SDK, installs it, and makes its links openable`, async () => {
    const calls: string[][] = [];
    const result = await installExpoGoAsync('SIM-1', 'ios', '57.0.19', {
      spawn: async (command, args) => {
        calls.push([command, ...args]);
        return captured({ stdout: command === 'npx' ? DOWNLOADED : '' });
      },
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async () => {},
    });

    expect(result).toMatchObject({ ok: true, version: '57.0.9' });
    expect(calls).toEqual([
      ['npx', '--yes', 'expo-go', 'download', 'ios', '57.0.19', '--json'],
      ['xcrun', 'simctl', 'install', 'SIM-1', '/tmp/dl/Expo-Go-57.0.9.tar.app'],
      // @ref ./installExpoGo §approveSchemesAsync — the install is not finished until the link
      // works, and on a freshly installed app iOS asks `Open in "Expo Go"?` first.
      ...['exp', 'exps'].map((scheme) => [
        'xcrun',
        'simctl',
        'spawn',
        'SIM-1',
        'defaults',
        'write',
        'com.apple.launchservices.schemeapproval',
        `com.apple.CoreSimulator.CoreSimulatorBridge-->${scheme}`,
        '-string',
        'host.exp.Exponent',
      ]),
      // And the second obstacle: a first-ever launch puts the developer-menu onboarding sheet over
      // the app, which would make the screenshot a picture of the sheet.
      [
        'xcrun',
        'simctl',
        'spawn',
        'SIM-1',
        'defaults',
        'write',
        'host.exp.Exponent',
        'EXDevMenuIsOnboardingFinished',
        '-bool',
        'true',
      ],
    ]);
  });

  // @ref ./installExpoGo §approveSchemesAsync
  //
  // An install whose approval failed is still an install: Expo Go is on the device, and the worst
  // case is the dialog the approval exists to remove. Reporting the whole install as failed would
  // throw away a 423 MB download over a preference write.
  it(`still reports the install when the scheme approval failed`, async () => {
    const result = await installExpoGoAsync('SIM-1', 'ios', '57.0.19', {
      spawn: async (command, args) =>
        captured({
          stdout: command === 'npx' ? DOWNLOADED : '',
          exitCode: args.includes('defaults') ? 1 : 0,
        }),
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async () => {},
    });

    expect(result.ok).toBe(true);
    expect(result.version).toBe('57.0.9');
  });

  // The download goes to a temporary directory and never to the project. The bundle is ~423 MB
  // extracted [observed, 2026-09-03], and a gate that left that in someone's repo would be worse
  // than the refusal it replaced.
  it(`downloads into a temporary directory, not the project`, async () => {
    let cwd: string | undefined;
    await installExpoGoAsync('SIM-1', 'ios', '57.0.0', {
      spawn: async (command, _args, options) => {
        if (command === 'npx') {
          cwd = options?.cwd;
        }
        return captured({ stdout: command === 'npx' ? DOWNLOADED : '' });
      },
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async () => {},
    });

    expect(cwd).toBe('/tmp/dl');
  });

  // And it is removed afterwards, on the way out of both the success and the failure.
  it.each([
    ['a successful install', 0],
    ['a failed install', 1],
  ])(`removes the download after %s`, async (_name, installExit) => {
    const removed: string[] = [];
    await installExpoGoAsync('SIM-1', 'ios', '57.0.0', {
      spawn: async (command) =>
        captured({
          stdout: command === 'npx' ? DOWNLOADED : '',
          exitCode: command === 'npx' ? 0 : installExit,
        }),
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async (dir) => {
        removed.push(dir);
      },
    });

    expect(removed).toEqual(['/tmp/dl']);
  });

  // The CLI's own sentence is quoted rather than replaced: it names the SDK it has no release for.
  it(`reports what the download CLI said when it refused`, async () => {
    const result = await installExpoGoAsync('SIM-1', 'ios', '99.0.0', {
      spawn: async () =>
        captured({
          stdout: '{"error":"Unable to find a version of Expo Go for SDK 99.0.0"}',
          exitCode: 1,
        }),
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async () => {},
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Unable to find a version of Expo Go for SDK 99.0.0');
  });

  // Nothing is installed when there is nothing to install, and `simctl` is never reached.
  it(`never runs simctl when the download produced no path`, async () => {
    const calls: string[] = [];
    const result = await installExpoGoAsync('SIM-1', 'ios', '57.0.0', {
      spawn: async (command) => {
        calls.push(command);
        return captured({ stdout: '{"path":null}' });
      },
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async () => {},
    });

    expect(calls).toEqual(['npx']);
    expect(result.ok).toBe(false);
  });

  // @ref ./installExpoGo — `simctl install` needs a **booted** device: it answers
  // `Unable to lookup in current state: Shutdown` (code 405) for one that is not
  // [observed, 2026-09-03]. That is the caller's ordering mistake, so the reason says so rather
  // than passing the raw CoreSimulator sentence along on its own.
  it(`explains a device that was not booted`, async () => {
    const result = await installExpoGoAsync('SIM-1', 'ios', '57.0.0', {
      spawn: async (command) =>
        captured({
          stdout: command === 'npx' ? DOWNLOADED : '',
          stderr:
            command === 'npx'
              ? ''
              : 'An error was encountered processing the command (domain=com.apple.CoreSimulator.SimError, code=405):\nUnable to lookup in current state: Shutdown',
          exitCode: command === 'npx' ? 0 : 1,
        }),
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async () => {},
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('booted');
  });

  // A binary that is not on `PATH` at all, which is an ordinary machine rather than a broken one.
  it(`reports a subprocess that could not be started`, async () => {
    const result = await installExpoGoAsync('SIM-1', 'ios', '57.0.0', {
      spawn: async () => ({
        ...captured({ exitCode: null }),
        spawnError: Object.assign(new Error('spawn npx ENOENT'), { code: 'ENOENT' }),
      }),
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async () => {},
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('ENOENT');
  });

  // Android is a different device tool, and this one only speaks `simctl`. Refused rather than
  // attempted, so the reason names the gap instead of an `xcrun` failure on a machine with no
  // simulators (llp/0005 §Android).
  it(`refuses a platform it cannot install on`, async () => {
    const spawn = jest.fn(async () => captured());
    const result = await installExpoGoAsync('EMULATOR-1', 'android', '57.0.0', {
      spawn,
      tempDirAsync: async () => '/tmp/dl',
      cleanupAsync: async () => {},
    });

    expect(spawn).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('android');
  });
});
