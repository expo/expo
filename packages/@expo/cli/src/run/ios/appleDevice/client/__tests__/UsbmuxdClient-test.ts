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
    ).rejects.toThrow(
      /There was an error connecting to the USB connected device \(id: 7, port: 8080\)/
    );
  });

  it('returns binary pair record data', async () => {
    const socket = mockSocket();
    const client = new UsbmuxdClient(socket);
    const protocolClient = client['protocolClient'];

    // Fake the response to `ReadPairRecord`
    protocolClient.sendMessage = jest.fn(async () => ({
      PairRecordData: createBinaryRecordPairList(),
    }));

    const pairRecord = await client.readPairRecord('00000000-0000000000000000');

    expect(protocolClient.sendMessage).toHaveBeenCalledWith({
      messageType: 'ReadPairRecord',
      extraFields: { PairRecordID: '00000000-0000000000000000' },
    });

    expect(pairRecord).toMatchObject({
      DeviceCertificate: expect.any(Buffer),
      HostPrivateKey: expect.any(Buffer),
      HostCertificate: expect.any(Buffer),
      RootPrivateKey: expect.any(Buffer),
      RootCertificate: expect.any(Buffer),
      EscrowBag: expect.any(Buffer),
      SystemBUID: '00000000-0000-0000-0000-000000000000',
      HostID: '00000000-0000-0000-0000-000000000000',
      WiFiMACAddress: '00:00:00:00:00:00',
    });
  });
});

/**
 * This returns a new buffer containing a fake record pair.
 * It was created using `bplist-creator` and contains an array with a single object:
 *   - DeviceCertificate: Buffer - fake RSA certificate
 *   - HostPrivateKey: Buffer - fake RSA certificate
 *   - HostCertificate: Buffer - fake RSA certificate
 *   - RootPrivateKey: Buffer - fake RSA certificate
 *   - RootCertificate: Buffer - fake RSA certificate
 *   - SystemBUID: String - fake UUID
 *   - HostID: String - fake UUID
 *   - WiFiMACAddress: String - fake mac address
 *   - EscrowBag: Buffer - fake binary data
 */
function createBinaryRecordPairList() {
  // eslint-disable-next-line
  return Buffer.from([98,112,108,105,115,116,48,48,217,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,15,16,17,95,16,17,68,101,118,105,99,101,67,101,114,116,105,102,105,99,97,116,101,94,72,111,115,116,80,114,105,118,97,116,101,75,101,121,95,16,15,72,111,115,116,67,101,114,116,105,102,105,99,97,116,101,94,82,111,111,116,80,114,105,118,97,116,101,75,101,121,95,16,15,82,111,111,116,67,101,114,116,105,102,105,99,97,116,101,90,83,121,115,116,101,109,66,85,73,68,86,72,111,115,116,73,68,89,69,115,99,114,111,119,66,97,103,94,87,105,70,105,77,65,67,65,100,100,114,101,115,115,79,16,69,45,45,45,45,45,66,69,71,73,78,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,10,70,65,75,69,67,69,82,84,73,70,73,67,65,84,69,10,45,45,45,45,45,69,78,68,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,79,16,69,45,45,45,45,45,66,69,71,73,78,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,10,70,65,75,69,67,69,82,84,73,70,73,67,65,84,69,10,45,45,45,45,45,69,78,68,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,79,16,69,45,45,45,45,45,66,69,71,73,78,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,10,70,65,75,69,67,69,82,84,73,70,73,67,65,84,69,10,45,45,45,45,45,69,78,68,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,79,16,69,45,45,45,45,45,66,69,71,73,78,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,10,70,65,75,69,67,69,82,84,73,70,73,67,65,84,69,10,45,45,45,45,45,69,78,68,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,79,16,69,45,45,45,45,45,66,69,71,73,78,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,10,70,65,75,69,67,69,82,84,73,70,73,67,65,84,69,10,45,45,45,45,45,69,78,68,32,67,69,82,84,73,70,73,67,65,84,69,45,45,45,45,45,95,16,36,48,48,48,48,48,48,48,48,45,48,48,48,48,45,48,48,48,48,45,48,48,48,48,45,48,48,48,48,48,48,48,48,48,48,48,48,79,16,32,206,45,193,159,211,251,129,201,174,214,65,183,21,2,174,8,4,129,192,54,122,18,186,255,220,102,10,67,38,254,75,240,95,16,17,48,48,58,48,48,58,48,48,58,48,48,58,48,48,58,48,48,0,8,0,27,0,47,0,62,0,80,0,95,0,113,0,124,0,131,0,141,0,156,0,228,1,44,1,116,1,188,2,4,2,43,2,78,0,0,0,0,0,0,2,1,0,0,0,0,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,98]);
}
