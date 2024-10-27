import { CommandError } from '../../../../utils/errors';
import { confirmAsync } from '../../../../utils/prompts';
import { runOnDevice } from '../AppleDevice';
import { installOnDeviceAsync } from '../installOnDeviceAsync';

jest.mock('../../../../utils/prompts');

jest.mock('../AppleDevice', () => ({
  runOnDevice: jest.fn(async () => {}),
}));

jest.mock('../../../../utils/interactive', () => ({
  isInteractive: jest.fn(() => true),
}));

describe(installOnDeviceAsync, () => {
  it(`resolves when the app is installed`, async () => {
    await installOnDeviceAsync({
      bundle: 'foo',
      appDeltaDirectory: 'bar',
      bundleIdentifier: 'baz',
      deviceName: 'qux',
      udid: 'quux',
    });

    expect(confirmAsync).not.toBeCalled();
  });
  it(`prompts to retry when the device is locked`, async () => {
    jest.mocked(runOnDevice).mockImplementationOnce(() => {
      throw new CommandError('APPLE_DEVICE_LOCKED', 'device locked');
    });
    jest.mocked(confirmAsync).mockImplementationOnce(async () => true);

    await installOnDeviceAsync({
      bundle: 'foo',
      appDeltaDirectory: 'bar',
      bundleIdentifier: 'baz',
      deviceName: 'qux',
      udid: 'quux',
    });

    expect(confirmAsync).toBeCalledTimes(1);
  });
  it(`prompts to retry and throws on false`, async () => {
    jest.mocked(runOnDevice).mockImplementationOnce(() => {
      throw new CommandError('APPLE_DEVICE_LOCKED', 'device locked');
    });
    jest.mocked(confirmAsync).mockImplementationOnce(async () => false);

    await expect(
      installOnDeviceAsync({
        bundle: '/path/to/foo.app',
        appDeltaDirectory: 'bar',
        bundleIdentifier: 'baz',
        deviceName: 'qux',
        udid: 'quux',
      })
    ).rejects.toThrow('Cannot launch foo on qux because the device is locked.');

    expect(confirmAsync).toBeCalledTimes(1);
  });
  it(`surfaces rejections`, async () => {
    jest.mocked(runOnDevice).mockImplementationOnce(() => {
      throw new Error('unknown');
    });

    await expect(
      installOnDeviceAsync({
        bundle: 'foo',
        appDeltaDirectory: 'bar',
        bundleIdentifier: 'baz',
        deviceName: 'qux',
        udid: 'quux',
      })
    ).rejects.toThrow(/unknown/);

    expect(confirmAsync).toBeCalledTimes(0);
  });
});
