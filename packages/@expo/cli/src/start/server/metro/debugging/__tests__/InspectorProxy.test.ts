import { unstable_InspectorProxy, unstable_Device } from '@react-native/dev-middleware';
import http from 'http';
import { parse } from 'url';
import WS from 'ws';

import { createInspectorProxyClass } from '../InspectorProxy';

// Due to `http.createServer` not closing on CI environments, we need to skip these tests
// TODO(cedric): find a proper solution for this
const describeWithCiSkip = process.env.CI === 'true' ? describe.skip : describe;

describeWithCiSkip('_createDeviceConnectionWSServer', () => {
  it(
    'accepts new app connection',
    withProxy(async ({ proxy, sockets, appWebSocketUrl }) => {
      // Create a new app connection, and wait for socket to be open
      sockets.app = new WS(appWebSocketUrl);
      await waitForSocketEvent(sockets.app, 'open');

      // Socket must be open, and app must be registered in the proxy
      expect(sockets.app.readyState).toBe(sockets.app.OPEN);
      expect(proxy._devices.size).toBe(1);
    })
  );

  it(
    'accepts new app connection with client-side id',
    withProxy(async ({ proxy, sockets, appWebSocketUrl }) => {
      // Create a new app connection, and wait for socket to be open
      sockets.app = new WS(`${appWebSocketUrl}?device=someuniqueid`);
      await waitForSocketEvent(sockets.app, 'open');

      // Soket must be open, app must be registered, and have the correct id
      expect(sockets.app.readyState).toBe(sockets.app.OPEN);
      expect(proxy._devices.size).toBe(1);
      expect(proxy._devices.get('someuniqueid')).toBeDefined();
    })
  );

  it(
    'removes device when app disconnects',
    withProxy(async ({ proxy, sockets, appWebSocketUrl }) => {
      // Create a new app connection, and wait for socket to be open
      sockets.app = new WS(appWebSocketUrl);
      await waitForSocketEvent(sockets.app, 'open');

      // App must be registered
      expect(proxy._devices.size).toBe(1);

      // Close app connection, and wait for socket to be closed
      sockets.app.close();
      await waitForSocketEvent(sockets.app, 'close');

      // Wait until the `socket.on('close')` event handler is called in the proxy
      await new Promise((resolve) => setTimeout(resolve));

      // App must be removed from the proxy
      expect(proxy._devices.size).toBe(0);
    })
  );
});

describeWithCiSkip('_createDebuggerConnectionWSServer', () => {
  it(
    'accepts new debugger connection when apps are connected',
    withProxy(async ({ proxy, sockets, appWebSocketUrl, debuggerWebSocketUrl }) => {
      // Create a new app connection, and wait for socket to be open
      sockets.app = new WS(appWebSocketUrl);
      await waitForSocketEvent(sockets.app, 'open');

      // App must be registered, and pull instance from proxy
      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      // Spy on the `handleDebuggerConnection` method
      const debugHandler = jest.spyOn(app, 'handleDebuggerConnection');

      // Create a new debugger connection, and wait for socket to be open
      sockets.debugger = new WS(`${debuggerWebSocketUrl}?device=${app._id}&page=1`);
      await waitForSocketEvent(sockets.debugger, 'open');

      // Debugger socket must be open and debugger must be registered to app
      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(debugHandler).toBeCalled();
    })
  );

  it(
    'accepts new debugger connection, with user agent from header, when apps are connected',
    withProxy(async ({ proxy, sockets, appWebSocketUrl, debuggerWebSocketUrl }) => {
      // Create a new app connection, and wait for socket to be open
      sockets.app = new WS(appWebSocketUrl);
      await waitForSocketEvent(sockets.app, 'open');

      // App must be registered, and pull instance from proxy
      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      // Spy on the `handleDebuggerConnection` method
      const debugHandler = jest.spyOn(app, 'handleDebuggerConnection');

      // Create a new debugger connection with user agent, and wait for socket to be open
      sockets.debugger = new WS(`${debuggerWebSocketUrl}?device=${app._id}&page=1`, {
        headers: {
          'User-Agent': 'vscode-expo-tools/1.0.0 vscode/420.69.0',
        },
      });
      await waitForSocketEvent(sockets.debugger, 'open');

      // Debugger socket must be open and debugger must be registered to app, including user agent
      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(debugHandler).toBeCalledWith(
        expect.anything(), // socket instance
        '1', // pageId
        expect.objectContaining({ userAgent: 'vscode-expo-tools/1.0.0 vscode/420.69.0' })
      );
    })
  );

  it(
    'accepts new debugger connection, with user agent from query paramter, when apps are connected',
    withProxy(async ({ proxy, sockets, appWebSocketUrl, debuggerWebSocketUrl }) => {
      // Create a new app connection, and wait for socket to be open
      sockets.app = new WS(appWebSocketUrl);
      await waitForSocketEvent(sockets.app, 'open');

      // App must be registered, and pull instance from proxy
      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      // Spy on the `handleDebuggerConnection` method
      const debugHandler = jest.spyOn(app, 'handleDebuggerConnection');
      const userAgent = encodeURIComponent('vscode-expo-tools/1.0.0 vscode/420.69.0');

      // Create a new debugger connection, and wait for socket to be open
      sockets.debugger = new WS(
        `${debuggerWebSocketUrl}?device=${app._id}&page=1&userAgent=${userAgent}`,
        {
          headers: {
            'User-Agent': 'wrong/one',
          },
        }
      );
      await waitForSocketEvent(sockets.debugger, 'open');

      // Debugger socket must be open and debugger must be registered to app, including user agent (from query paramter)
      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(debugHandler).toBeCalledWith(
        expect.anything(), // socket instance
        '1', // pageId
        expect.objectContaining({ userAgent: 'vscode-expo-tools/1.0.0 vscode/420.69.0' })
      );
    })
  );

  it(
    'keeps debugger connection alive when app reconnects',
    withProxy(async ({ proxy, sockets, appWebSocketUrl, debuggerWebSocketUrl }) => {
      // Create a "old" app connection, and wait for socket to be open
      sockets.oldApp = new WS(`${appWebSocketUrl}?device=samedevice`);
      await waitForSocketEvent(sockets.oldApp, 'open');

      // App must be registered, and pull instance from proxy
      const oldApp = proxy._devices.get('samedevice');
      expect(oldApp).toBeDefined();

      // Create a new debugger connection, and wait for socket to be open
      sockets.debugger = new WS(`${debuggerWebSocketUrl}?device=${oldApp._id}&page=1`);
      await waitForSocketEvent(sockets.debugger, 'open');

      // Debugger socket must be open, and registered to the "old" app
      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(oldApp._deviceSocket).not.toBeNull();

      // "Reconnect" the device using the new device connection, using the same id
      sockets.newApp = new WS(`${appWebSocketUrl}?device=${oldApp._id}`);

      // Wait until both sockets have updated
      await Promise.all([
        waitForSocketEvent(sockets.oldApp, 'close'),
        waitForSocketEvent(sockets.newApp, 'open'),
      ]);

      // "New" app connection must be registered, without sharing the same device instance
      const newApp = proxy._devices.get('samedevice');
      expect(newApp).not.toBe(oldApp);
      expect(proxy._devices.size).toBe(1);

      // Debugger and "new" app connections must be open, "old" app connection must be closed
      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(sockets.newApp.readyState).toBe(sockets.newApp.OPEN);
      expect(sockets.oldApp.readyState).toBe(sockets.oldApp.CLOSED);
    })
  );
});

type ProxyTestContext = Awaited<ReturnType<typeof createTestProxy>> & {
  /** All known sockets that needs to be teared down before the end of the test */
  sockets: Record<string, null | WS>;
};

function withProxy(testCase: (context: ProxyTestContext) => Promise<unknown>) {
  return async () => {
    const proxy = await createTestProxy();
    const sockets = {};

    try {
      await testCase({ ...proxy, sockets });
    } finally {
      await closeSockets(sockets);
      await closeSockets(proxy.websockets);
      await new Promise((resolve) => proxy.server.close(resolve));
    }
  };
}

function waitForSocketEvent(socket: null | WS, event: string) {
  return new Promise((resolve) => socket?.once(event, resolve));
}

async function closeSockets(sockets: Record<string, null | WS | WS.Server>) {
  for (const socket of Object.values(sockets)) {
    if (!socket) {
      continue;
    }

    if ('clients' in socket) {
      await new Promise((resolve) => {
        socket.clients.forEach((client) => client.terminate());
        socket.clients.clear();
        socket.close(resolve);
      });
    } else if (socket.readyState !== socket.CLOSED) {
      socket.close();
      await waitForSocketEvent(socket, 'close');
    }
  }
}

async function createTestProxy() {
  const server = http.createServer();
  const ExpoProxy = createInspectorProxyClass(unstable_InspectorProxy, unstable_Device);
  const proxy = new ExpoProxy('/test-app', 'http://localhost:8081');

  await new Promise<void>((resolve, reject) => {
    server.listen((error) => (error ? reject(error) : resolve()));
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Test server has no proper address');
  }

  const serverLocation =
    address.family === 'IPv6'
      ? `[${address.address}]:${address.port}`
      : `${address.address}:${address.port}`;

  const websockets: Record<string, WS.Server> = proxy.createWebSocketListeners();

  // Automatically upgrade the connection to websockets
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!);

    if (pathname !== null && websockets[pathname]) {
      websockets[pathname].handleUpgrade(request, socket, head, (ws) => {
        websockets[pathname].emit('connection', ws, request);
      });
    }
  });

  return {
    appWebSocketUrl: `ws://${serverLocation}/inspector/device`,
    debuggerWebSocketUrl: `ws://${serverLocation}/inspector/debug`,
    ExpoProxy,
    proxy,
    server,
    serverUrl: `http://${serverLocation}`,
    websockets,
  };
}
