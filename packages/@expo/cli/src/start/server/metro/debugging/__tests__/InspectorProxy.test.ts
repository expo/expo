import { unstable_InspectorProxy, unstable_Device } from '@react-native/dev-middleware';
import http from 'http';
import { parse } from 'url';
import WS from 'ws';

import { createInspectorProxyClass } from '../InspectorProxy';

describe('_createDeviceConnectionWSServer', () => {
  it('accepts new app connection', async () => {
    const { closeProxy, proxy, deviceWebSocketUrl } = await createTestProxy();
    const sockets = {
      device: new WS(deviceWebSocketUrl),
    };

    try {
      await new Promise((resolve) => sockets.device.on('open', resolve));

      expect(sockets.device.readyState).toBe(sockets.device.OPEN);
      expect(proxy._devices.size).toBe(1);
    } finally {
      closeSockets(sockets);
      closeProxy();
    }
  });

  it('accepts new app connection with client-side id', async () => {
    const { closeProxy, proxy, deviceWebSocketUrl } = await createTestProxy();
    const sockets = {
      device: new WS(`${deviceWebSocketUrl}?device=someuniqueid`),
    };

    try {
      await new Promise((resolve) => sockets.device.on('open', resolve));

      expect(sockets.device.readyState).toBe(sockets.device.OPEN);
      expect(proxy._devices.size).toBe(1);
      expect(proxy._devices.get('someuniqueid')).toBeDefined();
    } finally {
      closeSockets(sockets);
      closeProxy();
    }
  });

  it('removes device when app disconnects', async () => {
    const { closeProxy, proxy, deviceWebSocketUrl } = await createTestProxy();
    const sockets = {
      device: new WS(deviceWebSocketUrl),
    };

    try {
      await new Promise((resolve) => sockets.device.on('open', resolve));
      expect(proxy._devices.size).toBe(1);

      sockets.device.close();

      await new Promise((resolve) => sockets.device.on('close', resolve));
      // Wait until the `socket.on('close')` handler is called in the proxy
      await new Promise((resolve) => setTimeout(resolve));

      expect(proxy._devices.size).toBe(0);
    } finally {
      closeSockets(sockets);
      closeProxy();
    }
  });
});

describe('_createDebuggerConnectionWSServer', () => {
  it('accepts new debugger connection when apps are connected', async () => {
    const { closeProxy, proxy, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestProxy();
    const sockets: Record<string, null | WS> = {
      device: null,
      debugger: null,
    };

    try {
      sockets.device = new WS(deviceWebSocketUrl);
      await new Promise((resolve) => sockets.device?.on('open', resolve));

      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      const deviceDebugHandler = jest.spyOn(app, 'handleDebuggerConnection');

      sockets.debugger = new WS(`${debuggerWebSocketUrl}?device=${app._id}&page=1`);
      await new Promise((resolve) => sockets.debugger?.on('open', resolve));

      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(deviceDebugHandler).toBeCalled();
    } finally {
      closeSockets(sockets);
      closeProxy();
    }
  });

  it('accepts new debugger connection, with user agent from header, when apps are connected', async () => {
    const { closeProxy, proxy, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestProxy();
    const sockets: Record<string, null | WS> = {
      device: null,
      debugger: null,
    };

    try {
      sockets.device = new WS(deviceWebSocketUrl);
      await new Promise((resolve) => sockets.device?.on('open', resolve));

      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      const deviceDebugHandler = jest.spyOn(app, 'handleDebuggerConnection');

      sockets.debugger = new WS(`${debuggerWebSocketUrl}?device=${app._id}&page=1`, {
        headers: {
          'User-Agent': 'vscode-expo-tools/1.0.0 vscode/420.69.0',
        },
      });

      await new Promise((resolve) => sockets.debugger?.on('open', resolve));

      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(deviceDebugHandler).toBeCalledWith(
        expect.anything(), // socket instance
        '1', // pageId
        expect.objectContaining({ userAgent: 'vscode-expo-tools/1.0.0 vscode/420.69.0' })
      );
    } finally {
      closeSockets(sockets);
      closeProxy();
    }
  });

  it('accepts new debugger connection, with user agent from query paramter, when apps are connected', async () => {
    const { closeProxy, proxy, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestProxy();
    const sockets: Record<string, null | WS> = {
      device: null,
      debugger: null,
    };

    try {
      sockets.device = new WS(deviceWebSocketUrl);
      await new Promise((resolve) => sockets.device?.on('open', resolve));

      const app = proxy._devices.values().next().value;
      expect(app).toBeDefined();

      const deviceDebugHandler = jest.spyOn(app, 'handleDebuggerConnection');
      const userAgent = encodeURIComponent('vscode-expo-tools/1.0.0 vscode/420.69.0');

      sockets.debugger = new WS(
        `${debuggerWebSocketUrl}?device=${app._id}&page=1&userAgent=${userAgent}`,
        {
          headers: {
            'User-Agent': 'wrong/one',
          },
        }
      );

      await new Promise((resolve) => sockets.debugger?.on('open', resolve));

      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(deviceDebugHandler).toBeCalledWith(
        expect.anything(), // socket instance
        '1', // pageId
        expect.objectContaining({ userAgent: 'vscode-expo-tools/1.0.0 vscode/420.69.0' })
      );
    } finally {
      closeSockets(sockets);
      closeProxy();
    }
  });

  it('keeps debugger connection alive when app reconnects', async () => {
    const { closeProxy, proxy, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestProxy();
    const sockets: Record<string, null | WS> = {
      oldDevice: null,
      newDevice: null,
      debugger: null,
    };

    try {
      // Connect the "old" device first
      sockets.oldDevice = new WS(`${deviceWebSocketUrl}?device=samedevice`);
      await new Promise((resolve) => sockets.oldDevice?.on('open', resolve));
      // Proxy must know about the device
      const oldDevice = proxy._devices.get('samedevice');
      expect(oldDevice).toBeDefined();

      // Connect the debugger
      sockets.debugger = new WS(`${debuggerWebSocketUrl}?device=${oldDevice._id}&page=1`);
      await new Promise((resolve) => sockets.debugger?.on('open', resolve));
      // Debugger must be connected
      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      // Old device must know the debugger is connected
      expect(oldDevice._deviceSocket).not.toBeNull();

      // Reconnect the device using the "new" device connection
      sockets.newDevice = new WS(`${deviceWebSocketUrl}?device=${oldDevice._id}`);

      // Wait until both sockets have updated
      await Promise.all([
        new Promise((resolve) => sockets.oldDevice?.on('close', resolve)),
        new Promise((resolve) => sockets.newDevice?.on('open', resolve)),
      ]);

      const newDevice = proxy._devices.get('samedevice');
      expect(newDevice).not.toBe(oldDevice);
      expect(proxy._devices.size).toBe(1);

      // Check if the debugger and new device connections are still open
      expect(sockets.debugger.readyState).toBe(sockets.debugger.OPEN);
      expect(sockets.newDevice.readyState).toBe(sockets.newDevice.OPEN);
      expect(sockets.oldDevice.readyState).toBe(sockets.oldDevice.CLOSED);
    } finally {
      closeSockets(sockets);
      closeProxy();
    }
  });
});

function closeSockets(sockets: Record<string, null | WS>) {
  Object.values(sockets).forEach((socket) => socket?.close());
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

  // Clean up all open connections
  function closeProxy() {
    closeSockets(websockets);
    server.close();
  }

  return {
    closeProxy,
    server,
    serverUrl: `http://${serverLocation}`,
    deviceWebSocketUrl: `ws://${serverLocation}/inspector/device`,
    debuggerWebSocketUrl: `ws://${serverLocation}/inspector/debug`,
    proxy,
    ExpoProxy,
    websockets,
  };
}
