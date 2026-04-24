/// <reference types="node" />

import { TextDecoder, TextEncoder } from 'node:util';

import MockWebSocket from './MockWebSocket';
import { DevToolsPluginClient } from '../DevToolsPluginClient';
import { createDevToolsPluginClient } from '../DevToolsPluginClientFactory';
import { WebSocketBackingStore } from '../WebSocketBackingStore';
import { sendDevToolsRequestAsync } from '../sendDevToolsRequestAsync';

// @ts-expect-error - We don't mock all properties from WebSocket
globalThis.WebSocket = MockWebSocket;

// @ts-ignore
globalThis.TextDecoder ??= TextDecoder;
globalThis.TextEncoder ??= TextEncoder;

const TEST_PROTOCOL_VERSION = 1;

describe('sendDevToolsRequestAsync', () => {
  let appClient: DevToolsPluginClient;
  let cliClient: DevToolsPluginClient;
  let testCaseCounter = 0;
  let devServer: string;
  const pluginName = 'testPlugin';

  beforeEach(async () => {
    testCaseCounter += 1;
    devServer = `localhost:${9000 + testCaseCounter}`;
    [appClient, cliClient] = await Promise.all([
      createDevToolsPluginClient({
        protocolVersion: TEST_PROTOCOL_VERSION,
        devServer,
        sender: 'app',
        pluginName,
        wsStore: new WebSocketBackingStore(),
      }),
      createDevToolsPluginClient({
        protocolVersion: TEST_PROTOCOL_VERSION,
        devServer,
        sender: 'browser',
        pluginName,
        wsStore: new WebSocketBackingStore(),
      }),
    ]);
  });

  afterEach(async () => {
    await appClient.closeAsync();
    await cliClient.closeAsync();
  });

  it('resolves with the response when requestId matches', async () => {
    appClient.addMessageListener('ping', (data: any) => {
      appClient.sendMessage('response', { requestId: data.requestId, pong: true });
    });

    const result = await sendDevToolsRequestAsync(cliClient, 'ping');
    expect(result).toMatchObject({ pong: true });
  });

  it('rejects on timeout when no response is received', async () => {
    await expect(sendDevToolsRequestAsync(cliClient, 'noop', {}, 100)).rejects.toThrow(
      /Timeout waiting for response/
    );
  });

  it('ignores responses with non-matching requestId', async () => {
    appClient.addMessageListener('check', (data: any) => {
      // Send a response with wrong requestId first
      appClient.sendMessage('response', { requestId: 'wrong-id', value: 'bad' });
      // Then the correct one
      appClient.sendMessage('response', { requestId: data.requestId, value: 'good' });
    });

    const result = await sendDevToolsRequestAsync(cliClient, 'check');
    expect(result).toMatchObject({ value: 'good' });
  });

  it('passes params to the message', async () => {
    appClient.addMessageListener('echo', (data: any) => {
      appClient.sendMessage('response', {
        requestId: data.requestId,
        echoed: data.greeting,
      });
    });

    const result = await sendDevToolsRequestAsync(cliClient, 'echo', { greeting: 'hello' });
    expect(result).toMatchObject({ echoed: 'hello' });
  });
});
