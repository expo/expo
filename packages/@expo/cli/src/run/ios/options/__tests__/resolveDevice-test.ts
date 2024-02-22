import { AppleDeviceManager } from '../../../../start/platforms/ios/AppleDeviceManager';
import { sortDefaultDeviceToBeginningAsync } from '../../../../start/platforms/ios/promptAppleDevice';
import { promptDeviceAsync } from '../promptDevice';
import { resolveDeviceAsync } from '../resolveDevice';

const simulator = {
  udid: 'ADEF1A93-5D20-40C3-826C-5A4E04DBBB52',
  isAvailable: true,
  deviceTypeIdentifier: 'com.apple.CoreSimulator.SimDeviceType.iPhone-8',
  state: 'Booted',
  name: 'iPhone 8',
  runtime: 'com.apple.CoreSimulator.SimRuntime.iOS-15-4',
  osVersion: '15.4',
  windowName: 'iPhone 8 (15.4)',
  osType: 'iOS',
};

jest.mock('../../../../log');

jest.mock('../../appleDevice/AppleDevice', () => ({
  getConnectedDevicesAsync: jest.fn(async () => [
    {
      name: "Evan's phone",
      model: 'iPhone13,4',
      osVersion: '15.4.1',
      deviceType: 'device',
      connectionType: 'USB',
      udid: '00008101-001964A22629003A',
    },
  ]),
}));

jest.mock('../promptDevice', () => ({
  // sortDefaultDeviceToBeginningAsync
  promptDeviceAsync: jest.fn(async (devices) => devices[0]),
}));

jest.mock('../../../../start/platforms/ios/assertSystemRequirements', () => ({
  assertSystemRequirementsAsync: jest.fn(),
}));

jest.mock('../../../../start/platforms/ios/simctl', () => ({
  getDevicesAsync: jest.fn(() => [simulator, simulator]),
}));

jest.mock('../../../../start/platforms/ios/promptAppleDevice', () => ({
  sortDefaultDeviceToBeginningAsync: jest.fn((devices) => devices),
}));

jest.mock('../../../../start/platforms/ios/AppleDeviceManager', () => ({
  ensureSimulatorOpenAsync: jest.fn(async (obj) => obj),

  AppleDeviceManager: {
    assertSystemRequirementsAsync: jest.fn(),
    resolveAsync: jest.fn(async () => ({ device: simulator })),
  },
}));

describe(resolveDeviceAsync, () => {
  it(`resolves a default device`, async () => {
    expect((await resolveDeviceAsync(undefined, { osType: undefined })).name).toEqual('iPhone 8');
    expect(AppleDeviceManager.assertSystemRequirementsAsync).toBeCalled();
  });
  it(`prompts the user to select a device`, async () => {
    expect((await resolveDeviceAsync(true, { osType: undefined })).name).toEqual(`Evan's phone`);

    expect(promptDeviceAsync).toBeCalledWith([
      expect.anything(),
      expect.anything(),
      expect.anything(),
    ]);

    expect(AppleDeviceManager.assertSystemRequirementsAsync).toBeCalled();
    expect(sortDefaultDeviceToBeginningAsync).toBeCalled();
  });
  it(`searches for the provided device by name`, async () => {
    expect((await resolveDeviceAsync(`Evan's phone`, { osType: undefined })).name).toEqual(
      `Evan's phone`
    );

    expect(promptDeviceAsync).not.toBeCalled();

    expect(AppleDeviceManager.assertSystemRequirementsAsync).toBeCalled();
    expect(sortDefaultDeviceToBeginningAsync).toBeCalled();
  });
  it(`searches for the provided device by id`, async () => {
    expect(
      (await resolveDeviceAsync(`00008101-001964A22629003A`, { osType: undefined })).udid
    ).toEqual(`00008101-001964A22629003A`);

    expect(promptDeviceAsync).not.toBeCalled();

    expect(AppleDeviceManager.assertSystemRequirementsAsync).toBeCalled();
    expect(sortDefaultDeviceToBeginningAsync).toBeCalled();
  });
  it(`asserts the requested device could not be found`, async () => {
    await expect(resolveDeviceAsync(`foobar`, { osType: undefined })).rejects.toThrowError(
      /No device UDID or name matching "foobar"/
    );

    expect(promptDeviceAsync).not.toBeCalled();

    expect(AppleDeviceManager.assertSystemRequirementsAsync).toBeCalled();
    expect(sortDefaultDeviceToBeginningAsync).toBeCalled();
  });
});
