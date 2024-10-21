import { ConnectionInfo } from 'expo/build/devtools/devtools.types';
import {
  DevToolsPluginClient,
  getDevToolsPluginClientAsync,
  type DevToolsPluginClientOptions,
} from 'expo/devtools';
import { createDevToolsPluginClient } from 'expo/src/devtools/DevToolsPluginClientFactory';
import { WebSocketBackingStore } from 'expo/src/devtools/WebSocketBackingStore';
import { getConnectionInfo } from 'expo/src/devtools/getConnectionInfo';

export const name = 'DevToolsPluginClient';

const PLUGIN_NAME = 'test-suite';
const METHOD_PING = 'ping';
const METHOD_PONG = 'pong';

interface TestSuiteContext {
  browserEchoClient: DevToolsPluginClient;
  client: DevToolsPluginClient;
  responsePromise: Promise<any>;
}

export function test({ describe, expect, it, ...t }) {
  describe('Transportation tests', () => {
    const context: TestSuiteContext = {
      browserEchoClient: null,
      client: null,
      responsePromise: null,
    };
    setupContext(context, t, { websocketBinaryType: 'arraybuffer' });

    it('should support plaintext messages', async () => {
      const message = 'Test message';
      context.client.sendMessage(METHOD_PING, message);
      const response = await context.responsePromise;
      expect(response).toEqual(message);
    });

    it('should support object payload', async () => {
      const json = {
        foo: 'foo',
        bar: 'bar',
      };
      context.client.sendMessage(METHOD_PING, json);
      const response = await context.responsePromise;
      expect(response).toEqual(json);
    });

    it('should support binary payload', async () => {
      const payload = new Uint8Array([0x01, 0x02, 0x03]);
      context.client.sendMessage(METHOD_PING, payload);
      const response = await context.responsePromise;
      expect(response).toEqual(payload);
    });
  });
}

function setupContext(
  context: TestSuiteContext,
  t: Record<string, any>,
  options?: DevToolsPluginClientOptions
) {
  t.beforeAll(async () => {
    context.browserEchoClient = await createBrowserEchoClientAsync(PLUGIN_NAME, options);
  });

  t.beforeEach(async () => {
    context.client = await getDevToolsPluginClientAsync(PLUGIN_NAME, options);
    context.responsePromise = new Promise((resolve) => {
      context.client.addMessageListenerOnce(METHOD_PONG, (message) => {
        resolve(message);
      });
    });
  });

  t.afterAll(async () => {
    await context.browserEchoClient.closeAsync();
    await context.client.closeAsync();
  });
}

/**
 * Create a DevToolsPluginClient to simulate a client from webui.
 * This client just echoes back the received message from METHOD_PING event with METHOD_PONG event.
 *
 * We uses devtools internal APIs to create a client:
 *   - set sender to 'browser'
 *   - create a dedicated WebSocketBackingStore
 */
async function createBrowserEchoClientAsync(
  pluginName,
  options?: DevToolsPluginClientOptions
): Promise<DevToolsPluginClient> {
  const connectionInfo: ConnectionInfo = {
    ...getConnectionInfo(),
    sender: 'browser',
    wsStore: new WebSocketBackingStore(),
    pluginName,
  };
  const client = await createDevToolsPluginClient(connectionInfo, options);
  client.addMessageListener(METHOD_PING, (message) => {
    client.sendMessage(METHOD_PONG, message);
  });

  // @ts-expect-error: return type of `createDevToolsPluginClient` is internal but compatible with `DevToolsPluginClient`.
  return client;
}
