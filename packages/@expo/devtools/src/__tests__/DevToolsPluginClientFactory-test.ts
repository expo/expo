/// <reference types="node" />

import { TextDecoder, TextEncoder } from 'node:util';

import MockWebSocket from './MockWebSocket';
import {
  cleanupDevToolsPluginInstances,
  getDevToolsPluginClientAsync,
  setGetConnectionInfo,
} from '../DevToolsPluginClientFactory';
import { DevToolsPluginClientImplApp } from '../DevToolsPluginClientImplApp';
import { DevToolsPluginClientImplBrowser } from '../DevToolsPluginClientImplBrowser';

// @ts-expect-error - We don't mock all properties from WebSocket
globalThis.WebSocket = MockWebSocket;

// @ts-ignore - TextDecoder and TextEncoder are not defined in native jest environments.
globalThis.TextDecoder ??= TextDecoder;
globalThis.TextEncoder ??= TextEncoder;

const TEST_PROTOCOL_VERSION = 1;

describe(getDevToolsPluginClientAsync, () => {
  let mockConnectionInfo: ReturnType<Parameters<typeof setGetConnectionInfo>[0]>;

  function setConnectionInfo(info: typeof mockConnectionInfo) {
    mockConnectionInfo = info;
    setGetConnectionInfo(() => mockConnectionInfo);
  }

  afterEach(() => {
    jest.resetAllMocks();
    cleanupDevToolsPluginInstances();
  });

  it('should return a DevToolsPluginClientImplApp client when sender is from app', async () => {
    setConnectionInfo({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8081',
    });
    const client = await getDevToolsPluginClientAsync('testPlugin');
    expect(client).toBeInstanceOf(DevToolsPluginClientImplApp);
  });

  it('should return a DevToolsPluginClientImplApp client when sender is from browser', async () => {
    setConnectionInfo({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'browser',
      devServer: 'localhost:8081',
    });
    const client = await getDevToolsPluginClientAsync('testPlugin');
    expect(client).toBeInstanceOf(DevToolsPluginClientImplBrowser);
  });

  it('should return the same client from the same plugin name when called multiple times', async () => {
    setConnectionInfo({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8081',
    });
    const pluginName = 'testPlugin';

    const client = await getDevToolsPluginClientAsync(pluginName);
    const client2 = await getDevToolsPluginClientAsync(pluginName);
    expect(client).toBe(client2);
  });

  it('should return a new client from the same plugin name from disconnected', async () => {
    setConnectionInfo({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8081',
    });
    const pluginName = 'testPlugin';
    jest.spyOn(DevToolsPluginClientImplApp.prototype, 'isConnected').mockReturnValue(false);

    const client = await getDevToolsPluginClientAsync(pluginName);
    const client2 = await getDevToolsPluginClientAsync(pluginName);
    expect(client).not.toBe(client2);
  });

  it('should return a new client from the same plugin name when devServer changed', async () => {
    const pluginName = 'testPlugin';

    setConnectionInfo({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8081',
    });
    const client = await getDevToolsPluginClientAsync(pluginName);

    // Update the connection info to point to a different devServer
    mockConnectionInfo = {
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8082',
    };
    const client2 = await getDevToolsPluginClientAsync(pluginName);

    expect(client).not.toBe(client2);
  });

  it('should have at most one client per plugin name', async () => {
    setConnectionInfo({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8081',
    });
    const pluginName = 'testPlugin';
    const spy = jest.spyOn(DevToolsPluginClientImplApp.prototype, 'initAsync');

    const [client1, client2, client3, anotherClient] = await Promise.all([
      getDevToolsPluginClientAsync(pluginName),
      getDevToolsPluginClientAsync(pluginName),
      getDevToolsPluginClientAsync(pluginName),
      getDevToolsPluginClientAsync('anotherPlugin'),
    ]);
    expect(client1).toBe(client2);
    expect(client1).toBe(client3);
    expect(client1).not.toBe(anotherClient);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
