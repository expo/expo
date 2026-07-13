import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { WebSocket } from 'ws';

import type DevToolsPluginManager from '../DevToolsPluginManager';
import { createDevToolsPluginUpgradeHandler } from '../DevToolsPluginUpgradeHandler';
import type { DevToolsPluginRequestHandler } from '../DevToolsPluginServerHelpers';

describe(createDevToolsPluginUpgradeHandler, () => {
  it('commits a dynamic upgrade and wires the hooks to the socket', async () => {
    const { origin, handledResults, close } = await startServer(async (request, context) => {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/ws/')) {
        return null;
      }
      return context.upgrade({
        onopen(peer) {
          peer.send({
            type: 'welcome',
            pathname: url.pathname,
            search: url.search,
          });
        },
        onmessage(peer, message) {
          peer.send({ type: 'echo', message: message.text() });
        },
      });
    });

    try {
      const socket = new WebSocket(`${origin}/_expo/plugins/hello-plugin/ws/session-1?token=abc`);
      const welcome = nextMessage(socket);
      await new Promise((resolve) => socket.once('open', resolve));
      // The plugin prefix is stripped, so handlers see package-relative URLs.
      expect(JSON.parse(await welcome)).toEqual({
        type: 'welcome',
        pathname: '/ws/session-1',
        search: '?token=abc',
      });

      const echo = nextMessage(socket);
      socket.send('ping');
      expect(JSON.parse(await echo)).toEqual({ type: 'echo', message: 'ping' });

      socket.close();
      expect(handledResults).toEqual([true]);
    } finally {
      await close();
    }
  });

  it('applies headers set on the returned response to the 101 handshake', async () => {
    const { origin, close } = await startServer(async (request, context) => {
      const response = context.upgrade({});
      response.headers.set('x-connection-id', 'test-123');
      response.headers.append('Set-Cookie', 'plugin-session=abc; Path=/');
      response.headers.append('Set-Cookie', 'plugin-flag=1; Path=/');
      return response;
    });

    try {
      const socket = new WebSocket(`${origin}/_expo/plugins/hello-plugin/ws`);
      const handshake = await new Promise<http.IncomingMessage>((resolve, reject) => {
        socket.once('upgrade', resolve);
        socket.once('error', reject);
      });

      expect(handshake.statusCode).toBe(101);
      expect(handshake.headers['x-connection-id']).toBe('test-123');
      expect(handshake.headers['set-cookie']).toEqual([
        'plugin-session=abc; Path=/',
        'plugin-flag=1; Path=/',
      ]);

      socket.close();
    } finally {
      await close();
    }
  });

  it('rejects the upgrade when the handler returns a plain response', async () => {
    const { origin, handledResults, close } = await startServer(
      async () => new Response('Unauthorized', { status: 401 })
    );

    try {
      const socket = new WebSocket(`${origin}/_expo/plugins/hello-plugin/ws`);
      const rejection = await new Promise<http.IncomingMessage>((resolve, reject) => {
        socket.once('unexpected-response', (_request, response) => resolve(response));
        socket.once('open', () => reject(new Error('Expected the upgrade to be rejected')));
      });

      expect(rejection.statusCode).toBe(401);
      const body = await new Promise<string>((resolve) => {
        const chunks: Buffer[] = [];
        rejection.on('data', (chunk) => chunks.push(chunk));
        rejection.on('end', () => resolve(Buffer.concat(chunks).toString()));
      });
      expect(body).toBe('Unauthorized');
      expect(handledResults).toEqual([true]);
    } finally {
      await close();
    }
  });

  it('does not handle the upgrade when the handler returns null', async () => {
    const { origin, handledResults, close } = await startServer(async () => null);

    try {
      const socket = new WebSocket(`${origin}/_expo/plugins/hello-plugin/ws`);
      await new Promise((resolve) => socket.once('error', resolve));
      expect(handledResults).toEqual([false]);
    } finally {
      await close();
    }
  });

  it('does not handle upgrades for unknown plugins or non-plugin paths', async () => {
    const { origin, handledResults, close } = await startServer(async () => null);

    try {
      const unknownPlugin = new WebSocket(`${origin}/_expo/plugins/unknown-plugin/ws`);
      await new Promise((resolve) => unknownPlugin.once('error', resolve));

      const nonPluginPath = new WebSocket(`${origin}/hot`);
      await new Promise((resolve) => nonPluginPath.once('error', resolve));

      expect(handledResults).toEqual([false, false]);
    } finally {
      await close();
    }
  });

  it('does not handle upgrades for plugins without a serverEntryPoint', async () => {
    const { origin, handledResults, close } = await startServer(undefined);

    try {
      const socket = new WebSocket(`${origin}/_expo/plugins/hello-plugin/ws`);
      await new Promise((resolve) => socket.once('error', resolve));
      expect(handledResults).toEqual([false]);
    } finally {
      await close();
    }
  });

  it('rejects the upgrade with a 500 when the handler throws', async () => {
    const { origin, handledResults, close } = await startServer(async () => {
      throw new Error('boom');
    });

    try {
      const socket = new WebSocket(`${origin}/_expo/plugins/hello-plugin/ws`);
      const rejection = await new Promise<http.IncomingMessage>((resolve, reject) => {
        socket.once('unexpected-response', (_request, response) => resolve(response));
        socket.once('open', () => reject(new Error('Expected the upgrade to be rejected')));
      });

      expect(rejection.statusCode).toBe(500);
      expect(handledResults).toEqual([true]);
    } finally {
      await close();
    }
  });
});

function createPluginManager(requestHandler: DevToolsPluginRequestHandler | undefined) {
  const plugin = {
    packageName: 'hello-plugin',
    packageRoot: '/root/packages/hello-plugin',
    serverEntryPoint: requestHandler ? '/root/packages/hello-plugin/dist/server.js' : undefined,
    getRequestHandlerAsync: async () => requestHandler,
  };
  return {
    queryPluginAsync: jest.fn(async (pluginName: string) =>
      pluginName === 'hello-plugin' ? plugin : null
    ),
  } as unknown as DevToolsPluginManager;
}

async function startServer(requestHandler: DevToolsPluginRequestHandler | undefined) {
  const { upgradeHandler, dummyUpgradeEndpoint } = createDevToolsPluginUpgradeHandler(
    createPluginManager(requestHandler)
  );
  // Mirrors how `instantiateMetro` registers the endpoint: values are closed on server shutdown,
  // while the non-pathname key keeps it out of the exact-path upgrade dispatch.
  const webSocketServer = Object.values(dummyUpgradeEndpoint)[0]!;
  const server = http.createServer((req, res) => {
    res.statusCode = 404;
    res.end();
  });
  const handledResults: boolean[] = [];
  server.on('upgrade', async (request, socket, head) => {
    const handled = await upgradeHandler(request, socket, head);
    handledResults.push(handled);
    if (!handled) {
      socket.destroy();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    server,
    webSocketServer,
    handledResults,
    origin: `ws://127.0.0.1:${port}`,
    close: async () => {
      webSocketServer.close();
      webSocketServer.clients.forEach((client) => client.terminate());
      await new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      });
    },
  };
}

function nextMessage(socket: WebSocket): Promise<string> {
  return new Promise((resolve, reject) => {
    socket.once('message', (data) => resolve(data.toString()));
    socket.once('error', reject);
  });
}
