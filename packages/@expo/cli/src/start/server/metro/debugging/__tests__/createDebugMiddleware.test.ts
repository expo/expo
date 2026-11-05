import { createServer, type Server } from 'node:http';
import { connect, type AddressInfo } from 'node:net';

import { createDebugMiddleware } from '../createDebugMiddleware';

jest.mock('@react-native/dev-middleware', () => {
  const { WebSocketServer } = jest.requireActual('ws');
  return {
    createDevMiddleware: () => ({
      middleware: jest.fn(),
      websocketEndpoints: { '/inspector/debug': new WebSocketServer({ noServer: true }) },
    }),
  };
});

const INVALID_FRAME_PAYLOAD_DATA = 1007;

let server: Server;
let port: number;

beforeEach(async () => {
  const { debugWebsocketEndpoints } = createDebugMiddleware({
    serverBaseUrl: 'http://localhost',
    reporter: { update: jest.fn() } as any,
  });
  const networkEndpoint = debugWebsocketEndpoints['/inspector/network'];
  if (!networkEndpoint) throw new Error('Expected an /inspector/network endpoint');

  server = createServer();
  server.on('upgrade', (request, socket, head) => {
    networkEndpoint.handleUpgrade(request, socket, head, (ws) => {
      networkEndpoint.emit('connection', ws, request);
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as AddressInfo).port;
});

afterEach(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

it('closes a network inspector connection that sends a corrupt compressed frame', async () => {
  await expect(sendCorruptCompressedFrame(port)).resolves.toBe(INVALID_FRAME_PAYLOAD_DATA);
});

function sendCorruptCompressedFrame(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, '127.0.0.1', () => {
      socket.write(
        [
          'GET /inspector/network HTTP/1.1',
          `Host: 127.0.0.1:${port}`,
          'Upgrade: websocket',
          'Connection: Upgrade',
          'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version: 13',
          'Sec-WebSocket-Extensions: permessage-deflate',
          '',
          '',
        ].join('\r\n')
      );
    });

    let upgraded = false;
    socket.on('data', (chunk) => {
      if (!upgraded) {
        upgraded = true;
        socket.write(createCompressedFrameWithInvalidDeflateData());
        return;
      }

      const isCloseFrame = chunk[0] === 0x88;
      if (!isCloseFrame) return;

      socket.destroy();
      resolve(chunk.readUInt16BE(2));
    });
    socket.on('error', reject);
  });
}

function createCompressedFrameWithInvalidDeflateData(): Buffer {
  const finAndRsv1Text = 0xc1;
  const masked = 0x80;
  const payload = Buffer.from([0xde, 0xad, 0xbe, 0xef, 0x01, 0x02, 0x03, 0x04]);
  const mask = Buffer.from([0x11, 0x22, 0x33, 0x44]);
  const maskedPayload = payload.map((byte, index) => byte ^ mask.readUInt8(index % mask.length));

  return Buffer.concat([
    Buffer.from([finAndRsv1Text, masked | maskedPayload.length]),
    mask,
    maskedPayload,
  ]);
}
