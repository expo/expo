import { TextDecoder, TextEncoder } from 'util';

import MockWebSocket from './MockWebSocket';
import {
  cleanupDevToolsPluginInstances,
  getDevToolsPluginClientAsync,
} from '../DevToolsPluginClientFactory';
import { DevToolsPluginClientImplApp } from '../DevToolsPluginClientImplApp';
import { DevToolsPluginClientImplBrowser } from '../DevToolsPluginClientImplBrowser';
import { getConnectionInfo } from '../getConnectionInfo';

jest.mock('../getConnectionInfo');

// @ts-expect-error - We don't mock all properties from WebSocket
globalThis.WebSocket = MockWebSocket;

// @ts-ignore - TextDecoder and TextEncoder are not defined in native jest environments.
globalThis.TextDecoder ??= TextDecoder;
globalThis.TextEncoder ??= TextEncoder;

const TEST_PROTOCOL_VERSION = 1;

describe(getDevToolsPluginClientAsync, () => {
  const mockGetConnectionInfo = getConnectionInfo as jest.MockedFunction<typeof getConnectionInfo>;

  afterEach(() => {
    jest.resetAllMocks();
    cleanupDevToolsPluginInstances();
  });

  it('should return a DevToolsPluginClientImplApp client when sender is from app', async () => {
    mockGetConnectionInfo.mockReturnValue({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8081',
    });
    const client = await getDevToolsPluginClientAsync('testPlugin');
    expect(client).toBeInstanceOf(DevToolsPluginClientImplApp);
  });

  it('should return a DevToolsPluginClientImplApp client when sender is from browser', async () => {
    mockGetConnectionInfo.mockReturnValue({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'browser',
      devServer: 'localhost:8081',
    });
    const client = await getDevToolsPluginClientAsync('testPlugin');
    expect(client).toBeInstanceOf(DevToolsPluginClientImplBrowser);
  });

  it('should return the same client from the same plugin name when called multiple times', async () => {
    mockGetConnectionInfo.mockReturnValue({
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
    mockGetConnectionInfo.mockReturnValue({
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

    mockGetConnectionInfo.mockReturnValueOnce({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8081',
    });
    const client = await getDevToolsPluginClientAsync(pluginName);

    mockGetConnectionInfo.mockReturnValueOnce({
      protocolVersion: TEST_PROTOCOL_VERSION,
      sender: 'app',
      devServer: 'localhost:8082',
    });
    const client2 = await getDevToolsPluginClientAsync(pluginName);

    expect(client).not.toBe(client2);
  });

  it('should have at most one client per plugin name', async () => {
    mockGetConnectionInfo.mockReturnValue({
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
