import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';

import { xcrunAsync } from '../../../../start/platforms/ios/xcrun';
import { isInteractive } from '../../../../utils/interactive';
import * as oraUtils from '../../../../utils/ora';
import { installAndLaunchAppAsync, launchAppWithDeviceCtl } from '../devicectl';

jest.mock('../../../../start/platforms/ios/xcrun');
jest.mock('../../../../utils/interactive');
jest.mock('../../../../utils/exit');
jest.unmock('ora');

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
  afterEach(() => {
    for (const spinner of [...oraUtils.getAllSpinners()]) spinner.stop();
    jest.restoreAllMocks();
  });

  it.each([
    [true, '', 0],
    [false, '', 0],
    [true, '100%...', 0],
    [true, '100%...', 1],
  ])(
    'finishes the indicator after exit (interactive: %s, progress: %s, code: %s)',
    async (interactive, progress, code) => {
      jest.mocked(isInteractive).mockReturnValue(interactive);
      const realOra = oraUtils.ora;
      const output = new PassThrough();
      jest
        .spyOn(oraUtils, 'ora')
        .mockImplementation((text) => realOra({ text: text as string, stream: output }));
      const child = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        kill: jest.fn(),
      });
      jest.mocked(spawn).mockReturnValueOnce(child as any);
      jest.mocked(xcrunAsync).mockResolvedValueOnce({ stdout: '' } as any);

      const originalLog = console.log;
      const installation = installAndLaunchAppAsync({
        bundle: '/Test.app',
        bundleIdentifier: 'dev.expo.Test',
        udid: 'test-udid',
        deviceName: 'Test iPhone',
      });
      const spinner = oraUtils.getAllSpinners()[0]!;
      const succeed = jest.spyOn(spinner, 'succeed');
      if (progress) child.stdout.emit('data', Buffer.from(progress));
      expect(succeed).not.toHaveBeenCalled();
      child.emit('close', code);
      if (code === 0) {
        await installation;
        expect(succeed).toHaveBeenCalledTimes(1);
        expect(succeed).toHaveBeenCalledWith('Installed on Test iPhone');
      } else {
        await expect(installation).rejects.toThrow('Command failed with exit code 1');
        expect(succeed).not.toHaveBeenCalled();
        expect(xcrunAsync).not.toHaveBeenCalled();
      }
      expect(spinner.isSpinning).toBe(false);
      expect(oraUtils.getAllSpinners()).not.toContain(spinner);
      expect(console.log).toBe(originalLog);
    }
  );
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
