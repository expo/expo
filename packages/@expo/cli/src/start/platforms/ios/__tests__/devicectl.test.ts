import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { xcrunAsync } from '../../../../start/platforms/ios/xcrun';
import { installAndLaunchAppAsync, launchAppWithDeviceCtl } from '../devicectl';

jest.mock('../../../../start/platforms/ios/xcrun');

// A controllable spinner so we can assert on its final state. `devicectl` imports the local
// `ora` wrapper, which is what we mock here (the `ora` npm module is already globally mocked in
// jest.setup.ts).
const mockSpinner: any = {
  text: '',
  succeed: jest.fn(),
  fail: jest.fn(),
  stop: jest.fn(),
  clear: jest.fn(),
};
mockSpinner.start = jest.fn(() => mockSpinner);

jest.mock('../../../../utils/ora', () => ({
  ora: jest.fn(() => mockSpinner),
  logNewSection: jest.fn(() => mockSpinner),
  getAllSpinners: jest.fn(() => []),
}));

// Don't register real process exit listeners while the install promise is pending.
jest.mock('../../../../utils/exit', () => ({
  ...jest.requireActual('../../../../utils/exit'),
  installExitHooks: jest.fn(() => jest.fn()),
}));

describe(launchAppWithDeviceCtl, () => {
  it('throws generic error when `xcrun` fails without error logs', async () => {
    const error = new Error('Test: unknown error');

    jest.mocked(xcrunAsync).mockImplementationOnce(() => Promise.reject(error));

    await expect(() =>
      launchAppWithDeviceCtl('fake-device-id', 'com.exponent.Test')
    ).rejects.toThrow(`Test: unknown error`);
  });

  it('throws `APPLE_DEVICE_LOCKED` error when device is locked', async () => {
    const error = {
      message: 'xcrun exited with non-zero code: 1',
      stderr:
        'ERROR: The application failed to launch. (com.apple.dt.CoreDeviceError error 10002.)\n         BundleIdentifier = com.exponent.Test\n       ----------------------------------------\n       The request to open "com.exponent.Test" failed. (FBSOpenApplicationServiceErrorDomain error 1.)\n         NSLocalizedFailureReason = The request was denied by service delegate (SBMainWorkspace) for reason: Locked ("Unable to launch com.exponent.Test because the device was not, or could not be, unlocked").\n         BSErrorCodeDescription = RequestDenied\n         FBSOpenApplicationRequestID = 0xc34a\n       ----------------------------------------\n       The operation couldn’t be completed. Unable to launch com.exponent.Test because the device was not, or could not be, unlocked. (FBSOpenApplicationErrorDomain error 7.)\n         NSLocalizedFailureReason = Unable to launch com.exponent.Test because the device was not, or could not be, unlocked.\n         BSErrorCodeDescription = Locked',
    };

    jest.mocked(xcrunAsync).mockImplementationOnce(() => Promise.reject(error));

    await expect(() =>
      launchAppWithDeviceCtl('fake-device-id', 'com.exponent.Test')
    ).rejects.toThrow('Device is locked, unlock and try again.');
  });
});

// The exact stdout chunks `xcrun devicectl device install app` emits for a wired device.
const INSTALL_FIXTURE = [
  '15:06:52  Acquired tunnel connection to device.\n',
  '15:06:52  Enabling developer disk image services.\n',
  '15:06:52  Acquired usage assertion.\n',
  '57%... ',
  '60%... ',
  '62%... ',
  '66%... ',
  '68%... ',
  '72%... ',
  '74%... ',
  '76%... ',
  '80%... 84%... 88%... 92%... ',
  '96%... ',
  'Complete!\nApp installed:\n',
  '• bundleID: com.bacon.apr22\n' +
    '• installationURL: file:///private/var/containers/Bundle/Application/54B96933-4472-4D98-9D67-A1F8AFC14FDE/apr22.app/\n' +
    '• launchServicesIdentifier: unknown\n' +
    '• databaseUUID: 9D988F8D-8E2F-4C4A-B57A-69B11F70A7AD\n' +
    '• databaseSequenceNumber: 5892\n' +
    '• options: \n',
];

const INSTALL_PROPS = {
  bundle: '/path/to/App.app',
  bundleIdentifier: 'com.test.app',
  udid: '00008101-001964A22629003A',
  deviceName: 'Test iPhone',
};

function createFakeChildProcess() {
  const childProcess: any = new EventEmitter();
  childProcess.stdout = new EventEmitter();
  childProcess.stderr = new EventEmitter();
  childProcess.kill = jest.fn();
  return childProcess;
}

// Flush the queue so the install promise wires up its child-process `data`/`close` listeners.
const flushAsync = () => new Promise((resolve) => setImmediate(resolve));

describe(installAndLaunchAppAsync, () => {
  beforeEach(() => {
    mockSpinner.text = '';
    // The `xcrun devicectl ... process launch` call that runs after a successful install.
    jest.mocked(xcrunAsync).mockResolvedValue({ stdout: '', stderr: '' } as any);
  });

  it(`finishes at Complete 100% and resolves when the install prints no progress lines (wireless OTA)`, async () => {
    const childProcess = createFakeChildProcess();
    jest.mocked(spawn).mockReturnValue(childProcess);

    const promise = installAndLaunchAppAsync(INSTALL_PROPS);
    await flushAsync();

    // The OTA install path is silent — it exits 0 without ever emitting an `NN%...` line.
    childProcess.emit('close', 0);

    await expect(promise).resolves.toBeUndefined();

    // Without the terminal `updateProgress(100)` in the close handler the completion event never
    // fires, the spinner never stops, and `expo run:ios --device` hangs. Assert it completed.
    expect(mockSpinner.succeed).toHaveBeenCalledTimes(1);
    expect(mockSpinner.text).toContain('Complete');
    expect(mockSpinner.text).toContain('100%');
  });

  it(`completes exactly once when the install prints progress then a Complete line (wired)`, async () => {
    const childProcess = createFakeChildProcess();
    jest.mocked(spawn).mockReturnValue(childProcess);

    const promise = installAndLaunchAppAsync(INSTALL_PROPS);
    await flushAsync();

    INSTALL_FIXTURE.forEach((chunk) => childProcess.stdout.emit('data', Buffer.from(chunk)));
    childProcess.emit('close', 0);

    await expect(promise).resolves.toBeUndefined();

    // stdout already reported 100%, so the close handler's `updateProgress(100)` is a no-op and
    // must not complete the spinner a second time.
    expect(mockSpinner.succeed).toHaveBeenCalledTimes(1);
    expect(mockSpinner.text).toContain('Complete');
    expect(mockSpinner.text).toContain('100%');
  });
});
