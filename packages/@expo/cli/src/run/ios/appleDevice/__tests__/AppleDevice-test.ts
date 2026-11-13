import spawnAsync from '@expo/spawn-async';

import { getConnectedDevicesAsync } from '../AppleDevice';
import { LockdowndClient } from '../client/LockdowndClient';
import { UsbmuxdClient } from '../client/UsbmuxdClient';

jest.mock('../../../../start/platforms/ios/devicectl', () => ({
  getConnectedAppleDevicesAsync: jest.fn(async () => []),
}));

jest.mock('../../../events', () => ({
  debugEvent: jest.fn(),
}));

jest.mock('../client/UsbmuxdClient');
jest.mock('../client/LockdowndClient');

function mockUsbmuxdDevice({
  properties,
  lockdownValues,
}: {
  properties: Record<string, any>;
  lockdownValues: Record<string, any>;
}) {
  jest.mocked(UsbmuxdClient).mockImplementation(
    () =>
      ({
        socket: { end: jest.fn() },
        getDevices: jest.fn(async () => [
          { DeviceID: 1, MessageType: 'Attached', Properties: properties },
        ]),
        connect: jest.fn(async () => ({ end: jest.fn() })),
      }) as any
  );
  jest.mocked(LockdowndClient).mockImplementation(
    () =>
      ({
        getAllValues: jest.fn(async () => lockdownValues),
      }) as any
  );
}

describe(getConnectedDevicesAsync, () => {
  it(`resolves osType from DeviceClass for USB-connected devices`, async () => {
    mockUsbmuxdDevice({
      properties: { ConnectionType: 'USB', DeviceID: 1, SerialNumber: 'fake-udid' },
      lockdownValues: {
        DeviceClass: 'iPhone',
        DeviceName: 'iPhone',
        ProductName: 'iPhone OS',
        ProductType: 'iPhone10,6',
        ProductVersion: '16.7.16',
      },
    });

    await expect(getConnectedDevicesAsync()).resolves.toEqual([
      expect.objectContaining({ connectionType: 'USB', osType: 'iOS', udid: 'fake-udid' }),
    ]);
  });

  it(`falls back to ProductName when lockdownd omits DeviceClass (network-connected iOS <= 16 devices)`, async () => {
    // Over a network usbmuxd connection ("Connect via network"), lockdownd on
    // iOS <= 16 returns a reduced property set without `DeviceClass`.
    mockUsbmuxdDevice({
      properties: { ConnectionType: 'Network', DeviceID: 1, SerialNumber: 'fake-udid' },
      lockdownValues: {
        CPUArchitecture: 'arm64',
        DeviceName: 'iPhone',
        HardwareModel: 'D221AP',
        HumanReadableProductVersionString: '16.7.16',
        ProductName: 'iPhone OS',
        ProductType: 'iPhone10,6',
        ProductVersion: '16.7.16',
        SupportedDeviceFamilies: [1],
      },
    });

    await expect(getConnectedDevicesAsync()).resolves.toEqual([
      expect.objectContaining({ connectionType: 'Network', osType: 'iOS', udid: 'fake-udid' }),
    ]);
  });

  describe('on an Apple silicon Mac', () => {
    const originalPlatform = process.platform;
    const originalArch = process.arch;

    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      Object.defineProperty(process, 'arch', { value: 'arm64' });
      jest.mocked(UsbmuxdClient).mockImplementation(
        () =>
          ({
            socket: { end: jest.fn() },
            getDevices: jest.fn(async () => []),
          }) as any
      );
    });

    afterEach(() => {
      Object.defineProperty(process, 'platform', { value: originalPlatform });
      Object.defineProperty(process, 'arch', { value: originalArch });
    });

    it(`includes the host Mac as a macOS device`, async () => {
      jest.mocked(spawnAsync).mockResolvedValueOnce({
        stdout: [
          'Hardware:',
          '    Hardware Overview:',
          '      Chip: Apple M3 Pro',
          '      Provisioning UDID: 00008000-0000000000000001',
        ].join('\n'),
      } as any);

      await expect(getConnectedDevicesAsync()).resolves.toEqual([
        expect.objectContaining({
          udid: '00008000-0000000000000001',
          deviceType: 'device',
          osType: 'macOS',
        }),
      ]);
      expect(spawnAsync).toHaveBeenCalledWith('system_profiler', ['SPHardwareDataType']);
    });
  });
});
