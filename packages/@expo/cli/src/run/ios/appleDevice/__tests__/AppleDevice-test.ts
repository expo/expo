import { xcrunAsync } from '../../../../start/platforms/ios/xcrun';
import { launchAppWithDeviceCtl } from '../AppleDevice';

jest.mock('../../../../start/platforms/ios/xcrun');

describe(launchAppWithDeviceCtl, () => {
  it('throws generic error when `xcrun` fails without error logs', async () => {
    const error = new Error('Test: unknown error');

    jest.mocked(xcrunAsync).mockImplementationOnce(() => Promise.reject(error));

    await expect(() =>
      launchAppWithDeviceCtl('fake-device-id', 'com.exponent.Test')
    ).rejects.toThrow(`There was an error launching app: ${error}`);
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
