import { CommandError } from '../../../../utils/errors';
import { getAttachedDevicesAsync } from '../adb';
import { listAvdsAsync } from '../emulator';
import { getDevicesAsync, mergeDevices } from '../getDevices';

jest.mock('../adb', () => ({
  getAttachedDevicesAsync: jest.fn(),
}));
jest.mock('../emulator', () => ({
  listAvdsAsync: jest.fn(),
}));

it(`asserts no devices are available`, async () => {
  jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([]);
  jest.mocked(listAvdsAsync).mockResolvedValueOnce([]);
  await expect(getDevicesAsync()).rejects.toThrow(CommandError);
  expect(getAttachedDevicesAsync).toHaveBeenCalled();
  expect(listAvdsAsync).toHaveBeenCalled();
});

it('preserves AVD inventory tool failures', async () => {
  jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([]);
  jest.mocked(listAvdsAsync).mockRejectedValueOnce(new Error('emulator -list-avds failed'));

  await expect(getDevicesAsync()).rejects.toThrow('emulator -list-avds failed');
});

it('preserves attached devices when AVD inventory is unavailable', async () => {
  const device = {
    name: 'Pixel USB',
    pid: 'serial-1',
    type: 'device' as const,
    isBooted: true,
    isAuthorized: true,
  };
  jest.mocked(getAttachedDevicesAsync).mockResolvedValueOnce([device]);
  jest.mocked(listAvdsAsync).mockRejectedValueOnce(new Error('emulator -list-avds failed'));

  await expect(getDevicesAsync()).resolves.toEqual([device]);
});

describe(mergeDevices, () => {
  const avd = (name: string) => ({
    name,
    type: 'emulator' as const,
    isBooted: false,
    isAuthorized: true,
    isLaunchable: true,
  });

  it('preserves attached-device ordering and appends absent AVDs', () => {
    const physical = {
      name: 'Pixel USB',
      pid: 'serial-1',
      type: 'device' as const,
      isBooted: true,
      isAuthorized: true,
      connectionType: 'USB' as const,
    };
    const attachedAvd = { ...avd('Pixel_API_35'), pid: 'emulator-5554', isBooted: true };

    expect(
      mergeDevices([physical, attachedAvd], [avd('Pixel_API_35'), avd('Tablet_API_35')])
    ).toEqual([physical, attachedAvd, avd('Tablet_API_35')]);
  });
});
