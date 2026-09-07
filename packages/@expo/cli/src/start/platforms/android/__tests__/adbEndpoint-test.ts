import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { event } from '../../events';
import {
  ADB_HOST_PROBE_WAIT_LIMIT_MS,
  formatAdbEndpoint,
  parseAdbHostVersionResponse,
  probeAdbHostVersionAsync,
  resolveAdbEndpoint,
} from '../adbEndpoint';

jest.unmock('fs');
jest.unmock('node:fs');
jest.unmock('os');
jest.unmock('node:os');
jest.mock('../../events', () => ({ event: jest.fn() }));

it('allows for the cold-start device scan before a host probe expires', () => {
  expect(ADB_HOST_PROBE_WAIT_LIMIT_MS).toBe(4_000);
});

describe(resolveAdbEndpoint, () => {
  it('uses ADB_SERVER_SOCKET before Android address and port variables', () => {
    expect(
      resolveAdbEndpoint({
        ADB_SERVER_SOCKET: 'tcp:localhost:5041',
        ANDROID_ADB_SERVER_ADDRESS: '192.0.2.10',
        ANDROID_ADB_SERVER_PORT: '5042',
      })
    ).toEqual({
      type: 'tcp',
      host: 'localhost',
      port: 5041,
      scope: 'local',
      source: 'ADB_SERVER_SOCKET',
    });
  });

  it.each([
    [{}, { type: 'tcp', host: '127.0.0.1', port: 5037, scope: 'local', source: 'default' }],
    [
      { ANDROID_ADB_SERVER_PORT: '5041' },
      {
        type: 'tcp',
        host: '127.0.0.1',
        port: 5041,
        scope: 'local',
        source: 'ANDROID_ADB_SERVER_PORT',
      },
    ],
    [
      { ANDROID_ADB_SERVER_ADDRESS: '192.0.2.10' },
      {
        type: 'tcp',
        host: '192.0.2.10',
        port: 5037,
        scope: 'remote',
        source: 'ANDROID_ADB_SERVER_ADDRESS',
      },
    ],
    [
      { ANDROID_ADB_SERVER_ADDRESS: '::1', ANDROID_ADB_SERVER_PORT: '5041' },
      {
        type: 'tcp',
        host: '::1',
        port: 5041,
        scope: 'local',
        source: 'ANDROID_ADB_SERVER_ADDRESS',
      },
    ],
  ])('resolves Android address/port combination %#', (environment, endpoint) => {
    expect(resolveAdbEndpoint(environment)).toEqual(endpoint);
  });

  it.each([
    ['tcp:5041', { type: 'tcp', host: '127.0.0.1', port: 5041, scope: 'local' }],
    ['tcp:localhost:5041', { type: 'tcp', host: 'localhost', port: 5041, scope: 'local' }],
    ['tcp:[::1]:5041', { type: 'tcp', host: '::1', port: 5041, scope: 'local' }],
    ['tcp:192.0.2.10:5041', { type: 'tcp', host: '192.0.2.10', port: 5041, scope: 'remote' }],
  ])('parses the socket specification %s', (specification, endpoint) => {
    expect(resolveAdbEndpoint({ ADB_SERVER_SOCKET: specification })).toEqual({
      ...endpoint,
      source: 'ADB_SERVER_SOCKET',
    });
  });

  it('parses local filesystem sockets and preserves unsupported specifications', () => {
    expect(resolveAdbEndpoint({ ADB_SERVER_SOCKET: 'localfilesystem:/tmp/adb.sock' })).toEqual({
      type: 'local-filesystem',
      path: '/tmp/adb.sock',
      source: 'ADB_SERVER_SOCKET',
    });
    expect(resolveAdbEndpoint({ ADB_SERVER_SOCKET: 'localabstract:adb' })).toEqual({
      type: 'unsupported',
      specification: 'localabstract:adb',
      source: 'ADB_SERVER_SOCKET',
    });
  });
});

describe(formatAdbEndpoint, () => {
  it('brackets IPv6 addresses', () => {
    expect(
      formatAdbEndpoint({
        type: 'tcp',
        host: '::1',
        port: 5037,
        scope: 'local',
        source: 'default',
      })
    ).toBe('tcp:[::1]:5037 (local, selected by default)');
  });
});

describe('ADB smart-socket framing', () => {
  it.each([
    [Buffer.from('OKAY00040029'), { kind: 'version' }],
    [Buffer.from('FAIL0004nope'), { kind: 'adb-failure', message: 'nope' }],
    [Buffer.from('NOPE'), { kind: 'invalid-protocol' }],
    [Buffer.from('OKAY00'), { kind: 'incomplete' }],
    [Buffer.from('OKAY000400'), { kind: 'incomplete' }],
  ])('parses response fixture %#', (response, result) => {
    expect(parseAdbHostVersionResponse(response as Buffer)).toEqual(result);
  });
});

describe(probeAdbHostVersionAsync, () => {
  it('reads a complete host:version response across partial TCP packets', async () => {
    const server = net.createServer((socket) => {
      socket.once('data', () => {
        socket.write('OKAY');
        setTimeout(() => socket.end('00040029'), 5);
      });
    });
    const endpoint = await listenTcpAsync(server);
    try {
      await expect(probeAdbHostVersionAsync(endpoint, AbortSignal.timeout(500))).resolves.toEqual({
        kind: 'version',
      });
      expect(event).toHaveBeenCalledWith('adb_host_probe', {
        endpoint: expect.stringContaining(`tcp:${endpoint.host}:${endpoint.port}`),
        result: 'version',
      });
    } finally {
      await closeServerAsync(server);
    }
  });

  it('distinguishes an accepted connection with no complete reply', async () => {
    const server = net.createServer(() => {});
    const endpoint = await listenTcpAsync(server);
    try {
      await expect(probeAdbHostVersionAsync(endpoint, AbortSignal.timeout(50))).resolves.toEqual({
        kind: 'connected-no-reply',
      });
    } finally {
      await closeServerAsync(server);
    }
  });

  it('reports a listener that returns invalid ADB status bytes', async () => {
    const server = net.createServer((socket) => socket.end('NOPE'));
    const endpoint = await listenTcpAsync(server);
    try {
      await expect(probeAdbHostVersionAsync(endpoint, AbortSignal.timeout(500))).resolves.toEqual({
        kind: 'invalid-protocol',
      });
    } finally {
      await closeServerAsync(server);
    }
  });

  it('distinguishes refusal and retries a newly appearing local listener after startup grace', async () => {
    const reservation = net.createServer();
    const endpoint = await listenTcpAsync(reservation);
    await closeServerAsync(reservation);

    await expect(probeAdbHostVersionAsync(endpoint, AbortSignal.timeout(500))).resolves.toEqual({
      kind: 'connection-refused',
    });

    const server = net.createServer((socket) => socket.end('OKAY00040029'));
    trackServerConnections(server);
    const startServer = setTimeout(() => server.listen(endpoint.port, endpoint.host), 20);
    try {
      await expect(probeAdbHostVersionAsync(endpoint, AbortSignal.timeout(500))).resolves.toEqual({
        kind: 'version',
      });
    } finally {
      clearTimeout(startServer);
      await closeServerAsync(server);
    }
  });

  it('propagates explicit caller cancellation while reading', async () => {
    const server = net.createServer(() => {});
    const endpoint = await listenTcpAsync(server);
    const controller = new AbortController();
    const reason = new Error('caller cancelled');
    const cancellation = setTimeout(() => controller.abort(reason), 20);
    try {
      await expect(probeAdbHostVersionAsync(endpoint, controller.signal)).rejects.toBe(reason);
    } finally {
      clearTimeout(cancellation);
      await closeServerAsync(server);
    }
  });

  const filesystemTest = process.platform === 'win32' ? it.skip : it;
  filesystemTest('probes a selected local-filesystem socket', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-adb-endpoint-'));
    const socketPath = path.join(directory, 'adb.sock');
    const server = net.createServer((socket) => socket.end('OKAY00040029'));
    trackServerConnections(server);
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(socketPath, resolve);
    });
    try {
      await expect(
        probeAdbHostVersionAsync(
          { type: 'local-filesystem', path: socketPath, source: 'ADB_SERVER_SOCKET' },
          AbortSignal.timeout(500)
        )
      ).resolves.toEqual({ kind: 'version' });
    } finally {
      await closeServerAsync(server);
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});

async function listenTcpAsync(server: net.Server) {
  trackServerConnections(server);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected a TCP fixture server address.');
  }
  return {
    type: 'tcp' as const,
    host: address.address,
    port: address.port,
    scope: 'local' as const,
    source: 'default' as const,
  };
}

async function closeServerAsync(server: net.Server): Promise<void> {
  if (!server.listening) return;
  for (const socket of serverConnections.get(server) ?? []) socket.destroy();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
}

const serverConnections = new WeakMap<net.Server, Set<net.Socket>>();

function trackServerConnections(server: net.Server): void {
  const sockets = new Set<net.Socket>();
  serverConnections.set(server, sockets);
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.once('close', () => sockets.delete(socket));
  });
}
