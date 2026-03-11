import type { DevToolsPluginClient } from './DevToolsPluginClient.js';
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
export declare function sendDevToolsRequestAsync(client: DevToolsPluginClient, method: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<any>;
//# sourceMappingURL=sendDevToolsRequestAsync.d.ts.map