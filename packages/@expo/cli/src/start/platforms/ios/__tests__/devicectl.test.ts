import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { xcrunAsync } from '../../../../start/platforms/ios/xcrun';
import { ora } from '../../../../utils/ora';
import { installAndLaunchAppAsync, launchAppWithDeviceCtl } from '../devicectl';

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  spawn: jest.fn(),
}));
jest.mock('../../../../start/platforms/ios/xcrun');
jest.mock('../../../../utils/exit');
jest.mock('../../../../utils/ora');

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

describe(installAndLaunchAppAsync, () => {
  it('stops the spinner when devicectl exits without printing progress', async () => {
    const spinner = {
      isSpinning: true,
      succeed: jest.fn(() => {
        spinner.isSpinning = false;
      }),
      fail: jest.fn(),
    };
    jest.mocked(ora).mockReturnValue({ start: () => spinner } as any);

    jest.mocked(spawn).mockImplementationOnce(() => {
      const childProcess = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      process.nextTick(() => childProcess.emit('close', 0));
      return childProcess as any;
    });
    jest.mocked(xcrunAsync).mockResolvedValueOnce({ stdout: '' } as any);

    await installAndLaunchAppAsync({
      bundle: '/path/to/Test.app',
      bundleIdentifier: 'com.exponent.Test',
      udid: 'fake-device-id',
      deviceName: 'Fake iPhone',
    });

    expect(spinner.succeed).toHaveBeenCalledWith('Installed on Fake iPhone');
    expect(spinner.isSpinning).toBe(false);
  });
});

// const INSTALL_FIXTURE = [
//   '15:06:52  Acquired tunnel connection to device.\n',
//   '15:06:52  Enabling developer disk image services.\n',
//   '15:06:52  Acquired usage assertion.\n',
//   '57%... ',
//   '60%... ',
//   '62%... ',
//   '66%... ',
//   '68%... ',
//   '72%... ',
//   '74%... ',
//   '76%... ',
//   '80%... 84%... 88%... 92%... ',
//   '96%... ',
//   'Complete!\nApp installed:\n',
//   '• bundleID: com.bacon.apr22\n' +
//     '• installationURL: file:///private/var/containers/Bundle/Application/54B96933-4472-4D98-9D67-A1F8AFC14FDE/apr22.app/\n' +
//     '• launchServicesIdentifier: unknown\n' +
//     '• databaseUUID: 9D988F8D-8E2F-4C4A-B57A-69B11F70A7AD\n' +
//     '• databaseSequenceNumber: 5892\n' +
//     '• options: \n',
// ];
