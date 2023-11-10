import MockWebSocket from './MockWebSocket';
import { createDevToolsPluginClient } from '../DevToolsPluginClientFactory';
import { DevToolsPluginClientImplApp } from '../DevToolsPluginClientImplApp';

// @ts-expect-error - We don't mock all properties from WebSocket
globalThis.WebSocket = MockWebSocket;

describe(`DevToolsPluginClientImplApp`, () => {
  let testCaseCounter = 0;
  let devServer;

  beforeEach(() => {
    // Connect to different devServer for each test case to avoid jest parallel test issues.
    testCaseCounter += 1;
    devServer = `localhost:${8000 + testCaseCounter}`;
  });

  it('should not close the websocket connection while there are alive clients', async () => {
    const appClient1 = (await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName: 'plugin1',
    })) as DevToolsPluginClientImplApp;
    const appClient2 = (await createDevToolsPluginClient({
      devServer,
      sender: 'app',
      pluginName: 'plugin2',
    })) as DevToolsPluginClientImplApp;
    expect(appClient1.isConnected()).toBe(true);
    expect(appClient2.isConnected()).toBe(true);
    expect(DevToolsPluginClientImplApp.getRefCount()).toBe(2);
    const ws = DevToolsPluginClientImplApp.getWebSocket();
    if (!ws) {
      throw new Error('Null WebSocket');
    }
    const mockClose = jest.spyOn(ws, 'close');
    expect(mockClose).toHaveBeenCalledTimes(0);
    expect(ws.readyState).toBe(WebSocket.OPEN);

    await appClient1.closeAsync();
    expect(mockClose).toHaveBeenCalledTimes(0);
    expect(DevToolsPluginClientImplApp.getRefCount()).toBe(1);
    expect(ws.readyState).toBe(WebSocket.OPEN);

    await appClient2.closeAsync();
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(DevToolsPluginClientImplApp.getRefCount()).toBe(0);
    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });
});
