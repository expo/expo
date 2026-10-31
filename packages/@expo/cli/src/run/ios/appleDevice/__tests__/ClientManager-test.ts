import type { Socket } from 'net';

import { CommandError } from '../../../../utils/errors';
import { ClientManager } from '../ClientManager';
import { LockdowndClient } from '../client/LockdowndClient';
import type { UsbmuxdDevice, UsbmuxdPairRecord } from '../client/UsbmuxdClient';
import { UsbmuxdClient } from '../client/UsbmuxdClient';

function mockSocket(): { socket: Socket; destroy: jest.Mock } {
  const destroy = jest.fn();
  return { socket: { destroy } as unknown as Socket, destroy };
}

const networkDevice: UsbmuxdDevice = {
  DeviceID: 1,
  MessageType: 'Attached',
  Properties: {
    ConnectionType: 'Network',
    DeviceID: 1,
    SerialNumber: 'network-udid',
  },
};

describe(ClientManager.create, () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(`destroys the usbmux socket and rethrows when getDevice rejects`, async () => {
    const { socket, destroy } = mockSocket();
    const error = new CommandError('APPLE_DEVICE_USBMUXD', 'No device found');
    jest.spyOn(UsbmuxdClient, 'connectUsbmuxdSocket').mockReturnValue(socket);
    jest.spyOn(UsbmuxdClient.prototype, 'getDevice').mockRejectedValue(error);

    await expect(ClientManager.create('network-udid')).rejects.toBe(error);
    expect(destroy).toHaveBeenCalled();
  });

  it(`destroys the usbmux and lockdown sockets and rethrows when handshake fails`, async () => {
    const usbmux = mockSocket();
    const lockdown = mockSocket();
    const error = new CommandError('APPLE_DEVICE', 'Handshake failed');
    jest.spyOn(UsbmuxdClient, 'connectUsbmuxdSocket').mockReturnValue(usbmux.socket);
    jest.spyOn(UsbmuxdClient.prototype, 'getDevice').mockResolvedValue(networkDevice);
    jest
      .spyOn(UsbmuxdClient.prototype, 'readPairRecord')
      .mockResolvedValue({} as UsbmuxdPairRecord);
    jest.spyOn(UsbmuxdClient.prototype, 'connect').mockResolvedValue(lockdown.socket);
    jest.spyOn(LockdowndClient.prototype, 'doHandshake').mockRejectedValue(error);

    await expect(ClientManager.create('network-udid')).rejects.toBe(error);
    expect(usbmux.destroy).toHaveBeenCalled();
    expect(lockdown.destroy).toHaveBeenCalled();
  });
});
