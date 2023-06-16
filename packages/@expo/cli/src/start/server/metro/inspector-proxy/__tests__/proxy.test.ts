import connect from 'connect';
import http from 'http';
import { InspectorProxy as MetroProxy } from 'metro-inspector-proxy';
import fetch from 'node-fetch';
import { parse } from 'url';
import WS from 'ws';

import { ExpoInspectorProxy as ExpoProxy } from '../proxy';

it('shares devices with metro proxy', () => {
  const { expoProxy, metroProxy } = createTestProxy();
  expect(metroProxy._devices).toBe(expoProxy.devices);
});

it('responds to `/json` and `/json/list` endpoint', async () => {
  const { expoProxy } = createTestProxy();
  const app = connect();
  const { server, serverUrl } = await createTestServer(app);

  app.use(expoProxy.processRequest);

  try {
    const [jsonResponse, listResponse] = await Promise.all([
      fetch(`${serverUrl}/json`),
      fetch(`${serverUrl}/json/list`),
    ]);

    expect(jsonResponse.ok).toBe(true);
    expect(listResponse.ok).toBe(true);
    expect(await jsonResponse.json()).toBeDefined();
    expect(await listResponse.json()).toBeDefined();
  } finally {
    server.close();
  }
});

it('creates websocket listeners for device and debugger', async () => {
  const { expoProxy } = createTestProxy();
  const { server } = await createTestServer();

  const listeners = expoProxy.createWebSocketListeners(server);
  server.close();

  expect(listeners['/inspector/device']).toBeInstanceOf(WS.Server);
  expect(listeners['/inspector/debug']).toBeInstanceOf(WS.Server);
});

// The sourcemap references are relying on the server address
// Without proper failure, this could lead to unexpected sourcemap issues
it('fails when creating websocket listeners without server address', async () => {
  const { expoProxy } = createTestProxy();
  const { server } = await createTestServer();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  expect(() => expoProxy.createWebSocketListeners(server)).toThrowError(
    'could not resolve the server address'
  );
});

it('creates a new device when a client connects', async () => {
  const { expoProxy } = createTestProxy();
  const { server, deviceWebSocketUrl } = await createTestServer();
  useWebsockets(server, expoProxy.createWebSocketListeners(server));

  const device = new WS(deviceWebSocketUrl);

  try {
    await new Promise((resolve) => device.on('open', resolve));

    expect(device.readyState).toBe(device.OPEN);
    expect(expoProxy.devices.size).toBe(1);
  } finally {
    server.close();
    device.close();
  }
});

it('creates a new device with client-side device id when a client connects', async () => {
  const { expoProxy } = createTestProxy();
  const { server, deviceWebSocketUrl } = await createTestServer();
  useWebsockets(server, expoProxy.createWebSocketListeners(server));

  const device = new WS(`${deviceWebSocketUrl}?device=someuniqueid`);

  try {
    await new Promise((resolve) => device.on('open', resolve));

    expect(device.readyState).toBe(device.OPEN);
    expect(expoProxy.devices.size).toBe(1);
    expect(expoProxy.devices.get('someuniqueid')).toBeDefined();
  } finally {
    server.close();
    device.close();
  }
});

it('removes device when client disconnects', async () => {
  const { expoProxy } = createTestProxy();
  const { server, deviceWebSocketUrl } = await createTestServer();
  useWebsockets(server, expoProxy.createWebSocketListeners(server));

  const device = new WS(deviceWebSocketUrl);

  try {
    await new Promise((resolve) => device.on('open', resolve));
    expect(expoProxy.devices.size).toBe(1);

    device.close();

    await new Promise((resolve) => device.on('close', resolve));
    // Wait until the `socket.on('close')` handler is called in the proxy
    await new Promise((resolve) => setTimeout(resolve));

    expect(expoProxy.devices.size).toBe(0);
  } finally {
    server.close();
    device.close();
  }
});

it('accepts debugger connections when device is connected', async () => {
  const { expoProxy } = createTestProxy();
  const { server, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestServer();
  useWebsockets(server, expoProxy.createWebSocketListeners(server));

  let deviceWs: WS | null = null;
  let debuggerWs: WS | null = null;

  try {
    deviceWs = new WS(deviceWebSocketUrl);
    await new Promise((resolve) => deviceWs?.on('open', resolve));

    const device = expoProxy.devices.values().next().value;
    expect(device).toBeDefined();

    const deviceDebugHandler = jest.spyOn(device, 'handleDebuggerConnection');

    debuggerWs = new WS(`${debuggerWebSocketUrl}?device=${device._id}&page=1`);
    await new Promise((resolve) => debuggerWs?.on('open', resolve));

    expect(debuggerWs.readyState).toBe(debuggerWs.OPEN);
    expect(deviceDebugHandler).toBeCalled();
  } finally {
    server.close();
    deviceWs?.close();
    debuggerWs?.close();
  }
});

it('keeps debugger connection alive when device reconnects', async () => {
  const { expoProxy } = createTestProxy();
  const { server, deviceWebSocketUrl, debuggerWebSocketUrl } = await createTestServer();
  useWebsockets(server, expoProxy.createWebSocketListeners(server));

  let oldDeviceWs: WS | null = null;
  let newDeviceWs: WS | null = null;
  let debuggerWs: WS | null = null;

  try {
    // Connect the "old" device first
    oldDeviceWs = new WS(`${deviceWebSocketUrl}?device=samedevice`);
    await new Promise((resolve) => oldDeviceWs?.on('open', resolve));

    const oldDevice = expoProxy.devices.get('samedevice');
    expect(oldDevice).toBeDefined();

    // Connect the debugger
    const deviceDebugHandler = jest.spyOn(oldDevice!, 'handleDebuggerConnection');

    debuggerWs = new WS(`${debuggerWebSocketUrl}?device=samedevice&page=1`);
    await new Promise((resolve) => debuggerWs?.on('open', resolve));

    expect(debuggerWs.readyState).toBe(debuggerWs.OPEN);
    expect(deviceDebugHandler).toBeCalled();

    // Reconnect the device using the "new" device connection
    newDeviceWs = new WS(`${deviceWebSocketUrl}?device=samedevice`);

    // Wait until both sockets have updated
    await Promise.all([
      new Promise((resolve) => oldDeviceWs?.on('close', resolve)),
      new Promise((resolve) => newDeviceWs?.on('open', resolve)),
    ]);

    const newDevice = expoProxy.devices.get('samedevice');
    expect(newDevice).not.toBe(oldDevice);
    expect(expoProxy.devices.size).toBe(1);

    // Check if the debugger and new device connections are still open
    expect(debuggerWs.readyState).toBe(debuggerWs.OPEN);
    expect(newDeviceWs.readyState).toBe(newDeviceWs.OPEN);
    expect(oldDeviceWs.readyState).toBe(oldDeviceWs.CLOSED);
  } finally {
    server.close();
    oldDeviceWs?.close();
    newDeviceWs?.close();
    debuggerWs?.close();
  }
});

function createTestProxy() {
  class ExpoDevice {
    constructor(
      public readonly _id: string,
      public readonly _name: string,
      public readonly _app: string,
      public readonly _deviceSocket: WS
    ) {}

    handleDebuggerConnection() {}

    handleDuplicateDeviceConnection() {
      this._deviceSocket.close();
    }
  }

  const metroProxy = new MetroProxy();
  const expoProxy = new ExpoProxy(metroProxy, ExpoDevice);

  return { ExpoDevice, metroProxy, expoProxy };
}

async function createTestServer(app?: http.RequestListener) {
  const server = http.createServer(app);

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

  return {
    server,
    serverUrl: `http://${serverLocation}`,
    deviceWebSocketUrl: `ws://${serverLocation}/inspector/device`,
    debuggerWebSocketUrl: `ws://${serverLocation}/inspector/debug`,
  };
}

function useWebsockets(server: http.Server, websockets: Record<string, WS.Server>) {
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!);

    if (pathname !== null && websockets[pathname]) {
      websockets[pathname].handleUpgrade(request, socket, head, (ws) => {
        websockets[pathname].emit('connection', ws, request);
      });
    }
  });
}
