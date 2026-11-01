import type { Socket } from 'net';

import { CommandError } from '../../../../utils/errors';
import { ClientManager } from '../ClientManager';
import { LockdowndClient } from '../client/LockdowndClient';
import type { UsbmuxdPairRecord } from '../client/UsbmuxdClient';
import { UsbmuxdClient } from '../client/UsbmuxdClient';

afterEach(() => jest.restoreAllMocks());

it.each(['getDevice', 'readPairRecord', 'connect', 'doHandshake'] as const)(
  'releases the transport and preserves the error when %s fails',
  async (stage) => {
    const socket = { destroy: jest.fn() } as unknown as Socket;
    const error = new CommandError('APPLE_DEVICE_USBMUXD', 'Setup failed');
    jest.spyOn(UsbmuxdClient, 'connectUsbmuxdSocket').mockReturnValue(socket);
    const setup = {
      getDevice: jest.spyOn(UsbmuxdClient.prototype, 'getDevice').mockResolvedValue({
        DeviceID: 1,
        MessageType: 'Attached',
        Properties: { DeviceID: 1, ConnectionType: 'USB', SerialNumber: 'test-udid' },
      }),
      readPairRecord: jest
        .spyOn(UsbmuxdClient.prototype, 'readPairRecord')
        .mockResolvedValue({} as UsbmuxdPairRecord),
      connect: jest.spyOn(UsbmuxdClient.prototype, 'connect').mockResolvedValue(socket),
      doHandshake: jest
        .spyOn(LockdowndClient.prototype, 'doHandshake')
        .mockResolvedValue(undefined),
    };
    setup[stage].mockRejectedValueOnce(error);

    await expect(ClientManager.create('test-udid')).rejects.toBe(error);
    expect(socket.destroy).toHaveBeenCalledTimes(1);

    jest.mocked(socket.destroy).mockClear();
    await expect(ClientManager.create('test-udid')).resolves.toBeInstanceOf(ClientManager);
    expect(socket.destroy).not.toHaveBeenCalled();
  }
);
