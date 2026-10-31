import { ClientManager } from '../ClientManager';
import { UsbmuxdClient } from '../client/UsbmuxdClient';

jest.mock('../client/UsbmuxdClient', () => ({
  UsbmuxdClient: Object.assign(
    jest.fn(function (this: any, socket: any) {
      this.socket = socket;
      this.getDevice = jest.fn(async () => {
        throw new Error('Device not found');
      });
    }),
    { connectUsbmuxdSocket: jest.fn(() => ({ destroy: jest.fn() })) }
  ),
}));

describe(ClientManager.create, () => {
  it(`closes the usbmuxd socket when the device is not connected over USB`, async () => {
    await expect(ClientManager.create('fake-udid')).rejects.toThrow('Device not found');

    const socket = jest.mocked(UsbmuxdClient.connectUsbmuxdSocket).mock.results[0]!.value;
    expect(socket.destroy).toHaveBeenCalled();
  });
});
