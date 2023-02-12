import { Socket } from 'net';

import { AFCClient } from '../AFCClient';

function mockSocket() {
  return {
    on: jest.fn(),
  } as unknown as Socket;
}

describe('getFileInfo', () => {
  it(`returns public staging file info`, async () => {
    const socket = mockSocket();
    const client = new AFCClient(socket);
    client['protocolClient'].sendMessage = jest.fn(async () => ({
      operation: 2,
      id: 0,
      data: Buffer.from(
        'st_size64st_blocks0st_nlink2st_ifmtS_IFDIRst_mtime1649953057279565535st_birthtime1609900706331827343'
      ),
    }));

    await expect(client.getFileInfo('PublicStaging')).resolves.toEqual([]);
    expect(client['protocolClient'].sendMessage).toHaveBeenCalledWith({
      data: expect.anything(),
      operation: 10,
    });
  });
});

xdescribe('writeFile', () => {
  it(`returns public staging file info`, async () => {
    const socket = mockSocket();
    const client = new AFCClient(socket);
    client['protocolClient'].sendMessage = jest.fn(async () => ({
      operation: 2,
      id: 0,
      data: Buffer.from(
        'st_size64st_blocks0st_nlink2st_ifmtS_IFDIRst_mtime1649953057279565535st_birthtime1609900706331827343'
      ),
    }));

    await expect(
      client.writeFile(Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]), Buffer.from(''))
    ).resolves.toEqual([]);
    expect(client['protocolClient'].sendMessage).toHaveBeenCalledWith({
      data: expect.anything(),
      operation: 10,
    });
  });
});

describe('openFile', () => {
  it(`works`, async () => {
    const socket = mockSocket();
    const client = new AFCClient(socket);
    client['protocolClient'].sendMessage = jest.fn(async () => ({
      operation: 14,
      id: 71,
      data: Buffer.from([6, 0, 0, 0, 0, 0, 0, 0]),
    }));

    await expect(
      client['openFile'](
        'PublicStaging/yolo83.app/assets/node_modules/react-native/Libraries/LogBox/UI/LogBoxImages/loader.png'
      )
    ).resolves.toEqual(expect.anything());

    expect(client['protocolClient'].sendMessage).toHaveBeenCalledWith({
      data: Buffer.from([
        3, 0, 0, 0, 0, 0, 0, 0, 80, 117, 98, 108, 105, 99, 83, 116, 97, 103, 105, 110, 103, 47, 121,
        111, 108, 111, 56, 51, 46, 97, 112, 112, 47, 97, 115, 115, 101, 116, 115, 47, 110, 111, 100,
        101, 95, 109, 111, 100, 117, 108, 101, 115, 47, 114, 101, 97, 99, 116, 45, 110, 97, 116,
        105, 118, 101, 47, 76, 105, 98, 114, 97, 114, 105, 101, 115, 47, 76, 111, 103, 66, 111, 120,
        47, 85, 73, 47, 76, 111, 103, 66, 111, 120, 73, 109, 97, 103, 101, 115, 47, 108, 111, 97,
        100, 101, 114, 46, 112, 110, 103, 0,
      ]),
      operation: 13,
    });
  });
  it(`throws on invalid operation`, async () => {
    const socket = mockSocket();
    const client = new AFCClient(socket);
    client['protocolClient'].sendMessage = jest.fn(async () => ({
      operation: -1,
      id: 71,
      data: Buffer.from([6, 0, 0, 0, 0, 0, 0, 0]),
    }));

    await expect(
      client['openFile'](
        'PublicStaging/yolo83.app/assets/node_modules/react-native/Libraries/LogBox/UI/LogBoxImages/loader.png'
      )
    ).rejects.toThrowError(
      /There was an unknown error opening file PublicStaging\/yolo83.app\/assets\/node_modules\/react-native\/Libraries\/LogBox\/UI\/LogBoxImages\/loader\.png, response: 6,0,0,0,0,0,0,0/
    );
  });
});

describe('closeFile', () => {
  it(`works`, async () => {
    const socket = mockSocket();
    const client = new AFCClient(socket);
    client['protocolClient'].sendMessage = jest.fn(async () => ({
      operation: 2,
      id: 0,
      data: Buffer.from(''),
    }));

    await expect(client['closeFile'](Buffer.from([6, 0, 0, 0, 0, 0, 0, 0]))).resolves.toEqual({
      operation: 2,
      id: 0,
      data: expect.anything(),
    });

    expect(client['protocolClient'].sendMessage).toHaveBeenCalledWith({
      data: expect.anything(),
      operation: 20,
    });
  });
});

describe('makeDirectory', () => {
  it(`works`, async () => {
    const socket = mockSocket();
    const client = new AFCClient(socket);
    client['protocolClient'].sendMessage = jest.fn(async () => ({
      operation: 1,
      id: 1,
      data: 0 as any,
    }));

    await expect(client['makeDirectory']('PublicStaging/yolo83.app')).resolves.toEqual({
      operation: 1,
      id: 1,
      data: 0,
    });

    expect(client['protocolClient'].sendMessage).toHaveBeenCalledWith({
      data: expect.anything(),
      operation: 9,
    });
  });
});
