import { CommandError } from '../../../../utils/errors';
import { ClientManager } from '../ClientManager';

const mockSocketEnd = jest.fn();
const mockGetDevice = jest.fn();

jest.mock('../client/UsbmuxdClient', () => ({
  UsbmuxdClient: class {
    socket = { end: mockSocketEnd };
    getDevice = mockGetDevice;
    readPairRecord = jest.fn();
    connect = jest.fn();
    static connectUsbmuxdSocket = jest.fn(() => ({ end: mockSocketEnd }));
  },
}));

describe('create', () => {
  it(`closes the usbmuxd socket and rethrows when the device is not reachable over usbmuxd (e.g. wireless)`, async () => {
    // `getDevice()` rejects with `APPLE_DEVICE_USBMUXD` when usbmuxd has no USB device list,
    // which is the case for a Wi-Fi-only device that falls back to the `devicectl` install path.
    const error = new CommandError('APPLE_DEVICE_USBMUXD', 'No devices found');
    mockGetDevice.mockRejectedValueOnce(error);

    await expect(ClientManager.create('00008101-001964A22629003A')).rejects.toThrow(error);

    // The socket opened before the throw must be closed, otherwise it keeps the event loop alive
    // and `expo run:ios --device` hangs after the app installs and launches.
    expect(mockSocketEnd).toHaveBeenCalledTimes(1);
  });
});
