import { Socket } from 'net';

import { UsbmuxdClient } from '../UsbmuxdClient';

function mockSocket() {
  return {} as Socket;
}

describe('connect', () => {
  it(`connects on port`, async () => {
    const socket = mockSocket();
    const client = new UsbmuxdClient(socket);
    const protocolClient = client['protocolClient'];
    protocolClient.sendMessage = jest.fn(async () => ({ MessageType: 'Result', Number: 0 }));

    await expect(
      client.connect(
        {
          DeviceID: 7,
        },
        8080
      )
    ).resolves.toEqual(socket);
    expect(protocolClient.sendMessage).toHaveBeenCalledWith({
      extraFields: {
        DeviceID: 7,
        PortNumber: 36895,
      },
      messageType: 'Connect',
    });
  });
  it(`throws when the connection fails`, async () => {
    const socket = mockSocket();
    const client = new UsbmuxdClient(socket);
    const protocolClient = client['protocolClient'];
    protocolClient.sendMessage = jest.fn(async () => ({ MessageType: 'Fail' }));

    await expect(
      client.connect(
        {
          DeviceID: 7,
        },
        8080
      )
    ).rejects.toThrowError(
      /There was an error connecting to the USB connected device \(id: 7, port: 8080\)/
    );
  });
});
