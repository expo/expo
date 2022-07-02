import { GDBMessage } from '../../protocol/GDBProtocol';
import { DebugserverClient } from '../DebugserverClient';

function mockSocket() {
  return {
    on: jest.fn(),
    write: jest.fn(),
  } as unknown as import('net').Socket;
}

function createClient(returnValue?: any) {
  const client = new DebugserverClient(mockSocket());
  client['protocolClient'].sendMessage = jest.fn(() => returnValue);
  return client;
}

function testMessage(client: DebugserverClient, msg: GDBMessage) {
  expect(client['protocolClient'].sendMessage).toHaveBeenCalledWith(msg);
}

describe('setMaxPacketSize', () => {
  it(`works`, async () => {
    const client = createClient();
    await client.setMaxPacketSize(1024);
    testMessage(client, { cmd: 'QSetMaxPacketSize:', args: ['1024'] });
  });
});

describe('setWorkingDir', () => {
  it(`works`, async () => {
    const client = createClient();
    await client.setWorkingDir('foo/bar');
    testMessage(client, { cmd: 'QSetWorkingDir:', args: ['foo/bar'] });
  });
});

describe('checkLaunchSuccess', () => {
  it(`works`, async () => {
    const client = createClient();
    await client.checkLaunchSuccess();
    testMessage(client, { cmd: 'qLaunchSuccess', args: [] });
  });
});

describe('attachByName', () => {
  it(`works`, async () => {
    const client = createClient();
    await client.attachByName('foobar');
    testMessage(client, { cmd: 'vAttachName;666f6f626172', args: [] });
  });
});

describe('continue', () => {
  it(`works`, async () => {
    const client = createClient();
    await client.continue();
    testMessage(client, { cmd: 'c', args: [] });
  });
});

describe('halt', () => {
  it(`works`, async () => {
    const client = createClient();
    client['protocolClient'].socket.write = jest.fn();
    await client.halt();
    expect(client['protocolClient'].socket.write).toBeCalled();
  });
});
