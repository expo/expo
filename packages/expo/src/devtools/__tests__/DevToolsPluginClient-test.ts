import { TextDecoder, TextEncoder } from 'util';

import MockWebSocket from './MockWebSocket';
import { DevToolsPluginClient } from '../DevToolsPluginClient';
import { createDevToolsPluginClient } from '../DevToolsPluginClientFactory';
import { WebSocketBackingStore } from '../WebSocketBackingStore';

// @ts-expect-error - We don't mock all properties from WebSocket
globalThis.WebSocket = MockWebSocket;

// @ts-ignore - TextDecoder and TextEncoder are not defined in native jest environments.
globalThis.TextDecoder ??= TextDecoder;
globalThis.TextEncoder ??= TextEncoder;

describe(`DevToolsPluginClient`, () => {
  let appClient: DevToolsPluginClient;
  let testCaseCounter = 0;
  let devServer;
  const pluginName = 'testPlugin';

  beforeEach(async () => {
    // Connect to different devServer for each test case to avoid jest parallel test issues.
    testCaseCounter += 1;
    devServer = `localhost:${8000 + testCaseCounter}`;
    appClient = await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });
  });

  afterEach(async () => {
    await appClient.closeAsync();
  });

  it('should connect to the WebSocket server', async () => {
    expect(appClient.isConnected()).toBe(true);
  });
});

describe(`DevToolsPluginClient (browser <> app)`, () => {
  let testCaseCounter = 0;
  let devServer;
  const pluginName = 'testPlugin';
  let appClient: DevToolsPluginClient;
  let browserClient: DevToolsPluginClient;

  beforeEach(() => {
    // Connect to different devServer for each test case to avoid jest parallel test issues.
    testCaseCounter += 1;
    devServer = `localhost:${8000 + testCaseCounter}`;
  });

  afterEach(async () => {
    await appClient?.closeAsync();
    await browserClient?.closeAsync();
  });

  it('should send and receive messages', async () => {
    const method = 'testMethod';
    const message = { foo: 'bar' };

    appClient = await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });
    browserClient = await createDevToolsPluginClient({
      devServer,
      sender: 'browser',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });

    const receivedPromise = new Promise((resolve) => {
      appClient.addMessageListener(method, (params) => {
        resolve(params);
      });
    });

    browserClient.sendMessage(method, message);
    const received = await receivedPromise;
    expect(received).toEqual(message);
  });

  it('should support ping-pong messages', async () => {
    appClient = await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });
    browserClient = await createDevToolsPluginClient({
      devServer,
      sender: 'browser',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });

    const appPromise = new Promise((resolve) => {
      appClient.addMessageListener('ping', (params) => {
        appClient.sendMessage('pong', { from: 'app' });
        resolve(params);
      });
    });
    const browserPromise = new Promise((resolve) => {
      browserClient.addMessageListener('pong', (params) => {
        resolve(params);
      });
    });

    browserClient.sendMessage('ping', { from: 'browser' });
    const receivedPing = await appPromise;
    expect(receivedPing).toEqual({ from: 'browser' });
    const receivedPong = await browserPromise;
    expect(receivedPong).toEqual({ from: 'app' });
  });

  it('should not receive messages from differnet plugin', async () => {
    const method = 'testMethod';
    const message = { foo: 'bar' };

    appClient = await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });
    browserClient = await createDevToolsPluginClient({
      devServer,
      sender: 'browser',
      pluginName: 'pluginB',
      wsStore: new WebSocketBackingStore(),
    });

    const receivedPromise = new Promise((resolve) => {
      appClient.addMessageListener(method, (params) => {
        resolve(params);
      });
    });

    browserClient.sendMessage(method, message);
    expect(receivedPromise).rejects.toThrow();
  });

  it('should only allow the latest connected client with the same plugin name to receive messages', async () => {
    const method = 'testMethod';

    appClient = await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });
    const receivedMessages: any[] = [];
    appClient.addMessageListener(method, (params) => {
      receivedMessages.push(params);
    });

    browserClient = await createDevToolsPluginClient({
      devServer,
      sender: 'browser',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });

    await delayAsync(100);
    const browserClient2 = await createDevToolsPluginClient({
      devServer,
      sender: 'browser',
      pluginName,
      wsStore: new WebSocketBackingStore(),
    });

    await delayAsync(100);
    expect(browserClient.isConnected()).toBe(false);
    expect(browserClient2.isConnected()).toBe(true);
    browserClient.sendMessage(method, { from: 'browserClient' });
    browserClient2.sendMessage(method, { from: 'browserClient2' });

    await delayAsync(100);
    expect(receivedMessages.length).toBe(1);
    expect(receivedMessages[0]).toEqual({ from: 'browserClient2' });
    await browserClient2.closeAsync();
  });
});

describe(`DevToolsPluginClient - multiplexing`, () => {
  let testCaseCounter = 0;
  let devServer;

  beforeEach(() => {
    // Connect to different devServer for each test case to avoid jest parallel test issues.
    testCaseCounter += 1;
    devServer = `localhost:${8000 + testCaseCounter}`;
  });

  it('should not close the websocket connection while there are alive clients', async () => {
    const wsStore = new WebSocketBackingStore();
    const appClient1 = await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName: 'plugin1',
      wsStore,
    });
    const appClient2 = await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName: 'plugin2',
      wsStore,
    });
    expect(appClient1.isConnected()).toBe(true);
    expect(appClient2.isConnected()).toBe(true);
    expect(appClient1.getWebSocketBackingStore()).toBe(wsStore);
    expect(appClient2.getWebSocketBackingStore()).toBe(wsStore);
    expect(wsStore.refCount).toBe(2);
    const ws = wsStore.ws;
    if (!ws) {
      throw new Error('Null WebSocket');
    }
    const mockClose = jest.spyOn(ws, 'close');
    expect(mockClose).toHaveBeenCalledTimes(0);
    expect(ws.readyState).toBe(WebSocket.OPEN);

    await appClient1.closeAsync();
    expect(mockClose).toHaveBeenCalledTimes(0);
    expect(wsStore.refCount).toBe(1);
    expect(ws.readyState).toBe(WebSocket.OPEN);

    await appClient2.closeAsync();
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(wsStore.refCount).toBe(0);
    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });
});

async function delayAsync(timeMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeMs));
}
