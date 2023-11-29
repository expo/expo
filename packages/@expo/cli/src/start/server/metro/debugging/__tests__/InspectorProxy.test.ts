import { unstable_InspectorProxy, unstable_Device } from '@react-native/dev-middleware';
import http from 'http';
import { parse } from 'url';
import WS from 'ws';

import { createInspectorProxyClass } from '../InspectorProxy';

describe('_createDeviceConnectionWSServer', () => {
  it('accepts new app connection', async () => {
    const { proxy, server, deviceWebSocketUrl } = await createTestProxy();
    const device = new WS(deviceWebSocketUrl);

    try {
      await new Promise((resolve) => device.on('open', resolve));

      expect(device.readyState).toBe(device.OPEN);
      expect(proxy._devices.size).toBe(1);
    } finally {
      server.close();
      device.close();
    }
  });

  it('accepts new app connection with client-side id', async () => {
    const { proxy, server, deviceWebSocketUrl } = await createTestProxy();
    const device = new WS(`${deviceWebSocketUrl}?device=someuniqueid`);

    try {
      await new Promise((resolve) => device.on('open', resolve));

      expect(device.readyState).toBe(device.OPEN);
      expect(proxy._devices.size).toBe(1);
      expect(proxy._devices.get('someuniqueid')).toBeDefined();
    } finally {
      server.close();
      device.close();
    }
  });

  it('removes device when app disconnects', async () => {
    const { proxy, server, deviceWebSocketUrl } = await createTestProxy();
    const device = new WS(deviceWebSocketUrl);

    try {
      await new Promise((resolve) => device.on('open', resolve));
      expect(proxy._devices.size).toBe(1);

      device.close();

      await new Promise((resolve) => device.on('close', resolve));
      // Wait until the `socket.on('close')` handler is called in the proxy
      await new Promise((resolve) => setTimeout(resolve));

      expect(proxy._devices.size).toBe(0);
    } finally {
      server.close();
      device.close();
    }
  });
});

describe('_createDebuggerConnectionWSServer', () => {
  it('accepts new debugger connection when apps are connected', async () => {
    const { proxy, server, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestProxy();

    let deviceSocket: WS | null = null;
    let debuggerSocket: WS | null = null;

    try {
      deviceSocket = new WS(deviceWebSocketUrl);
      await new Promise((resolve) => deviceSocket?.on('open', resolve));

      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      const deviceDebugHandler = jest.spyOn(app, 'handleDebuggerConnection');

      debuggerSocket = new WS(`${debuggerWebSocketUrl}?device=${app._id}&page=1`);
      await new Promise((resolve) => debuggerSocket?.on('open', resolve));

      expect(debuggerSocket.readyState).toBe(debuggerSocket.OPEN);
      expect(deviceDebugHandler).toBeCalled();
    } finally {
      server.close();
      deviceSocket?.close();
      debuggerSocket?.close();
    }
  });

  it('accepts new debugger connection, with user agent from header, when apps are connected', async () => {
    const { proxy, server, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestProxy();

    let deviceSocket: WS | null = null;
    let debuggerSocket: WS | null = null;

    try {
      deviceSocket = new WS(deviceWebSocketUrl);
      await new Promise((resolve) => deviceSocket?.on('open', resolve));

      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      const deviceDebugHandler = jest.spyOn(app, 'handleDebuggerConnection');

      debuggerSocket = new WS(`${debuggerWebSocketUrl}?device=${app._id}&page=1`, {
        headers: {
          'User-Agent': 'vscode-expo-tools/1.0.0 vscode/420.69.0',
        },
      });

      await new Promise((resolve) => debuggerSocket?.on('open', resolve));

      expect(debuggerSocket.readyState).toBe(debuggerSocket.OPEN);
      expect(deviceDebugHandler).toBeCalledWith(
        expect.anything(), // socket instance
        '1', // pageId
        expect.objectContaining({ userAgent: 'vscode-expo-tools/1.0.0 vscode/420.69.0' })
      );
    } finally {
      server.close();
      deviceSocket?.close();
      debuggerSocket?.close();
    }
  });

  it('accepts new debugger connection, with user agent from query paramter, when apps are connected', async () => {
    const { proxy, server, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestProxy();

    let deviceSocket: WS | null = null;
    let debuggerSocket: WS | null = null;

    try {
      deviceSocket = new WS(deviceWebSocketUrl);
      await new Promise((resolve) => deviceSocket?.on('open', resolve));

      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      const deviceDebugHandler = jest.spyOn(app, 'handleDebuggerConnection');
      const userAgent = encodeURIComponent('vscode-expo-tools/1.0.0 vscode/420.69.0');

      debuggerSocket = new WS(
        `${debuggerWebSocketUrl}?device=${app._id}&page=1&userAgent=${userAgent}`,
        {
          headers: {
            'User-Agent': 'wrong/one',
          },
        }
      );

      await new Promise((resolve) => debuggerSocket?.on('open', resolve));

      expect(debuggerSocket.readyState).toBe(debuggerSocket.OPEN);
      expect(deviceDebugHandler).toBeCalledWith(
        expect.anything(), // socket instance
        '1', // pageId
        expect.objectContaining({ userAgent: 'vscode-expo-tools/1.0.0 vscode/420.69.0' })
      );
    } finally {
      server.close();
      deviceSocket?.close();
      debuggerSocket?.close();
    }
  });

  it('keeps debugger connection alive when app reconnects', async () => {
    const { proxy, server, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestProxy();

    let oldDeviceSocket: WS | null = null;
    let newDeviceSocket: WS | null = null;
    let debuggerSocket: WS | null = null;

    try {
      // Connect the "old" device first
      oldDeviceSocket = new WS(`${deviceWebSocketUrl}?device=samedevice`);
      await new Promise((resolve) => oldDeviceSocket?.on('open', resolve));
      // Proxy must know about the device
      const oldDevice = proxy._devices.get('samedevice');
      expect(oldDevice).toBeDefined();

      // Connect the debugger
      debuggerSocket = new WS(`${debuggerWebSocketUrl}?device=${oldDevice._id}&page=1`);
      await new Promise((resolve) => debuggerSocket?.on('open', resolve));
      // Debugger must be connected
      expect(debuggerSocket.readyState).toBe(debuggerSocket.OPEN);
      // Old device must know the debugger is connected
      expect(oldDevice._deviceSocket).not.toBeNull();

      // Reconnect the device using the "new" device connection
      newDeviceSocket = new WS(`${deviceWebSocketUrl}?device=${oldDevice._id}`);

      // Wait until both sockets have updated
      await Promise.all([
        new Promise((resolve) => oldDeviceSocket?.on('close', resolve)),
        new Promise((resolve) => newDeviceSocket?.on('open', resolve)),
      ]);

      const newDevice = proxy._devices.get('samedevice');
      expect(newDevice).not.toBe(oldDevice);
      expect(proxy._devices.size).toBe(1);

      // Check if the debugger and new device connections are still open
      expect(debuggerSocket.readyState).toBe(debuggerSocket.OPEN);
      expect(newDeviceSocket.readyState).toBe(newDeviceSocket.OPEN);
      expect(oldDeviceSocket.readyState).toBe(oldDeviceSocket.CLOSED);
    } finally {
      server.close();
      oldDeviceSocket?.close();
      newDeviceSocket?.close();
      debuggerSocket?.close();
    }
  });
});

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

  const websockets = proxy.createWebSocketListeners();

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
    server,
    serverUrl: `http://${serverLocation}`,
    deviceWebSocketUrl: `ws://${serverLocation}/inspector/device`,
    debuggerWebSocketUrl: `ws://${serverLocation}/inspector/debug`,
    proxy,
    ExpoProxy,
    websockets,
  };
}
