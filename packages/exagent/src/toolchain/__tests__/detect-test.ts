/* eslint-env jest */
// @ref llp/0004-smart-start-and-project-state.rfc.md §Where a build runs
// The probes, against a mocked machine. Every case is one of the three answers a probe may give,
// and `unknown` is a case of its own throughout: a probe that could not decide has not shown the
// toolchain to be missing, and a plan that treated it as missing would send a caller to the cloud
// over a tool that is sitting right there.
import { vol } from 'memfs';

import { detectToolchainAsync, resetToolchainCache } from '../detect';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('os', () => ({
  ...jest.requireActual('os'),
  homedir: () => '/home/dev',
}));
jest.mock('../../utils/spawnCapture', () => ({ spawnCaptureAsync: jest.fn() }));
jest.mock('../../utils/subprocess', () => ({ findExecutableOnPath: jest.fn(() => null) }));

const { spawnCaptureAsync } = jest.requireMock('../../utils/spawnCapture');
const { findExecutableOnPath } = jest.requireMock('../../utils/subprocess');

/** The default Android SDK location on a Mac, which is where this machine's SDK actually is. */
const MAC_SDK = '/home/dev/Library/Android/sdk';

/** One captured run, in the shape `spawnCaptureAsync` resolves with. */
function ran(stdout: string, exitCode = 0, stderr = '') {
  return { stdout, stderr, exitCode };
}

/** Answer each command by name, so a test says what the machine has rather than what ran first. */
function machineWith(answers: Record<string, ReturnType<typeof ran>>) {
  spawnCaptureAsync.mockImplementation(async (command: string) => {
    const answer = answers[command];
    if (!answer) {
      return { stdout: '', stderr: '', exitCode: null, spawnError: enoent(command) };
    }
    return answer;
  });
}

function enoent(command: string): NodeJS.ErrnoException {
  const error: NodeJS.ErrnoException = new Error(`spawn ${command} ENOENT`);
  error.code = 'ENOENT';
  return error;
}

beforeEach(() => {
  vol.reset();
  resetToolchainCache();
  jest.clearAllMocks();
  findExecutableOnPath.mockReturnValue(null);
  Object.defineProperty(process, 'platform', { value: 'darwin' });
  delete process.env.ANDROID_HOME;
  delete process.env.ANDROID_SDK_ROOT;
});

const realPlatform = process.platform;
afterAll(() => {
  Object.defineProperty(process, 'platform', { value: realPlatform });
});

describe('detectToolchainAsync — ios', () => {
  it('reports present when xcode-select points at a developer dir xcodebuild runs in', async () => {
    machineWith({
      'xcode-select': ran('/Applications/Xcode.app/Contents/Developer\n'),
      xcodebuild: ran('Xcode 16.2\nBuild version 16C5032a\n'),
    });

    const probe = await detectToolchainAsync('ios');

    expect(probe.status).toBe('present');
    expect(probe.platform).toBe('ios');
    expect(probe.requirement).toBe('Xcode on this machine');
    expect(probe.detail).toContain('Xcode 16.2');
    expect(probe.detail).toContain('/Applications/Xcode.app/Contents/Developer');
  });

  it('reports missing when only the Command Line Tools are installed', async () => {
    // `xcode-select -p` answers, and `xcodebuild` refuses: the exact shape of a machine with the
    // Command Line Tools and no Xcode, which cannot build an app however well it compiles C.
    machineWith({
      'xcode-select': ran('/Library/Developer/CommandLineTools\n'),
      xcodebuild: ran('', 1, "xcode-select: error: tool 'xcodebuild' requires Xcode"),
    });

    const probe = await detectToolchainAsync('ios');

    expect(probe.status).toBe('missing');
    expect(probe.detail).toContain('Command Line Tools');
    expect(probe.detail).toContain('/Library/Developer/CommandLineTools');
  });

  it('reports missing when xcode-select is not on PATH at all', async () => {
    machineWith({});

    const probe = await detectToolchainAsync('ios');

    expect(probe.status).toBe('missing');
    expect(probe.detail).toContain('xcode-select');
  });

  it('reports missing when xcode-select finds no developer directory', async () => {
    machineWith({
      'xcode-select': ran('', 2, 'xcode-select: error: unable to get active developer directory'),
    });

    const probe = await detectToolchainAsync('ios');

    expect(probe.status).toBe('missing');
    expect(probe.detail).toContain('unable to get active developer directory');
  });

  it('reports missing on a host that is not macOS, naming the reason', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    machineWith({});

    const probe = await detectToolchainAsync('ios');

    expect(probe.status).toBe('missing');
    expect(probe.detail).toContain('macOS');
    // Nothing was spawned: the host settles it, and a probe is not free.
    expect(spawnCaptureAsync).not.toHaveBeenCalled();
  });

  it('reports unknown when the probe itself fails, which is not the same as missing', async () => {
    spawnCaptureAsync.mockRejectedValue(new Error('the sandbox refused to spawn anything'));

    const probe = await detectToolchainAsync('ios');

    expect(probe.status).toBe('unknown');
    expect(probe.detail).toContain('the sandbox refused to spawn anything');
  });
});

describe('detectToolchainAsync — android', () => {
  it('reports present for an SDK at the default location, with no env var set', async () => {
    vol.fromJSON({ [`${MAC_SDK}/platform-tools/adb`]: '#!/bin/sh\n' });

    const probe = await detectToolchainAsync('android');

    expect(probe.status).toBe('present');
    expect(probe.requirement).toBe('the Android SDK on this machine');
    expect(probe.detail).toContain(MAC_SDK);
  });

  // This machine, exactly: the SDK is where the installer puts it, ANDROID_HOME is unset, and
  // `adb` is not on PATH. Nothing about that stops a Gradle build, and reporting it as missing
  // would send a caller to the cloud over an SDK that is sitting on the disk — so it is a caveat.
  it('says so when the SDK is there and adb is not on PATH', async () => {
    vol.fromJSON({ [`${MAC_SDK}/platform-tools/adb`]: '#!/bin/sh\n' });
    findExecutableOnPath.mockReturnValue(null);

    const probe = await detectToolchainAsync('android');

    expect(probe.status).toBe('present');
    expect(probe.caveats.join(' ')).toContain('adb is not on PATH');
    expect(probe.caveats.join(' ')).toContain(`${MAC_SDK}/platform-tools`);
    expect(probe.caveats.join(' ')).toContain('ANDROID_HOME');
  });

  it('adds no adb caveat when adb is on PATH', async () => {
    vol.fromJSON({ [`${MAC_SDK}/platform-tools/adb`]: '#!/bin/sh\n' });
    findExecutableOnPath.mockReturnValue('/usr/local/bin/adb');

    const probe = await detectToolchainAsync('android');

    expect(probe.status).toBe('present');
    expect(probe.caveats.join(' ')).not.toContain('adb is not on PATH');
  });

  it('prefers ANDROID_HOME over the default location', async () => {
    process.env.ANDROID_HOME = '/opt/android';
    vol.fromJSON({
      '/opt/android/platform-tools/adb': '#!/bin/sh\n',
      [`${MAC_SDK}/platform-tools/adb`]: '#!/bin/sh\n',
    });

    const probe = await detectToolchainAsync('android');

    expect(probe.status).toBe('present');
    expect(probe.detail).toContain('/opt/android');
    expect(probe.detail).toContain('ANDROID_HOME');
  });

  it('reports missing when ANDROID_HOME names a directory that is not there', async () => {
    process.env.ANDROID_HOME = '/opt/android';

    const probe = await detectToolchainAsync('android');

    expect(probe.status).toBe('missing');
    expect(probe.detail).toContain('ANDROID_HOME');
    expect(probe.detail).toContain('/opt/android');
  });

  it('reports missing when nothing names an SDK and the default is not there', async () => {
    const probe = await detectToolchainAsync('android');

    expect(probe.status).toBe('missing');
    expect(probe.detail).toContain(MAC_SDK);
    expect(probe.detail).toContain('ANDROID_HOME');
  });

  it('reports present for an SDK directory without platform-tools', async () => {
    // A partially installed SDK still has to be reported as found: what it is missing is a package
    // the Android tooling installs itself, and this probe is not a doctor.
    vol.fromJSON({ [`${MAC_SDK}/licenses/android-sdk-license`]: 'x' });

    const probe = await detectToolchainAsync('android');

    expect(probe.status).toBe('present');
    expect(probe.caveats.join(' ')).toContain('platform-tools');
  });
});

describe('the per-process cache', () => {
  it('probes once per platform', async () => {
    machineWith({
      'xcode-select': ran('/Applications/Xcode.app/Contents/Developer\n'),
      xcodebuild: ran('Xcode 16.2\n'),
    });

    const first = await detectToolchainAsync('ios');
    const second = await detectToolchainAsync('ios');

    expect(second).toBe(first);
    expect(spawnCaptureAsync).toHaveBeenCalledTimes(2);
  });

  it('caches the two platforms separately', async () => {
    vol.fromJSON({ [`${MAC_SDK}/platform-tools/adb`]: '#!/bin/sh\n' });
    machineWith({
      'xcode-select': ran('/Applications/Xcode.app/Contents/Developer\n'),
      xcodebuild: ran('Xcode 16.2\n'),
    });

    const ios = await detectToolchainAsync('ios');
    const android = await detectToolchainAsync('android');

    expect(ios.platform).toBe('ios');
    expect(android.platform).toBe('android');
  });
});
