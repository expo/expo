import type { DevToolsPluginClient } from './DevToolsPluginClient.js';

const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Sends a named message to a DevTools plugin and waits for a correlated response.
 *
 * The message is sent with a unique `requestId` that the receiver is expected to
 * echo back in a `'response'` message. The returned promise resolves with the
 * full response payload once a matching `requestId` is received.
 *
 * @param client  The DevToolsPluginClient to communicate through.
 * @param method  The message name / method to send.
 * @param params  Optional parameters to include in the message.
 * @param timeoutMs  How long to wait for a response before rejecting (default 5 000 ms).
 */
export async function sendDevToolsRequestAsync(
  client: DevToolsPluginClient,
  method: string,
  params: Record<string, unknown> = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<any> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      sub.remove();
      reject(new Error(`Timeout waiting for response to '${method}'`));
    }, timeoutMs);
    const sub = client.addMessageListener('response', (data: any) => {
      if (data.requestId === requestId) {
        clearTimeout(timeout);
        sub.remove();
        resolve(data);
      }
    });
    client.sendMessage(method, { ...params, requestId });
  });
}
