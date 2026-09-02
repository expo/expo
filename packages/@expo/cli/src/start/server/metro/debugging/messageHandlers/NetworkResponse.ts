import type { Protocol } from 'devtools-protocol';

import { MessageHandler } from '../MessageHandler';
import type {
  CdpMessage,
  DeviceRequest,
  DebuggerRequest,
  DebuggerResponse,
  DeviceResponse,
} from '../types';

/**
 * The global network response storage, as a workaround for the network inspector.
 * @see createDebugMiddleware#createNetworkWebsocket
 */
export const NETWORK_RESPONSE_STORAGE = new Map<
  string,
  DebuggerResponse<NetworkGetResponseBody>['result']
>();

// Bounded so an unauthenticated client on `/inspector/network` cannot grow this
// map without limit. `Map` preserves insertion order, so the first key is the
// oldest entry — drop it on overflow (FIFO).
const MAX_NETWORK_RESPONSES = 512;

export function recordNetworkResponse(
  requestId: string,
  info: DebuggerResponse<NetworkGetResponseBody>['result']
) {
  NETWORK_RESPONSE_STORAGE.set(requestId, info);
  if (NETWORK_RESPONSE_STORAGE.size > MAX_NETWORK_RESPONSES) {
    const oldestKey = NETWORK_RESPONSE_STORAGE.keys().next().value;
    if (oldestKey !== undefined) {
      NETWORK_RESPONSE_STORAGE.delete(oldestKey);
    }
  }
}

export class NetworkResponseHandler extends MessageHandler {
  /** All known responses, mapped by request id */
  storage = NETWORK_RESPONSE_STORAGE;

  handleDeviceMessage(message: DeviceRequest<NetworkReceivedResponseBody>) {
    if (message.method === 'Expo(Network.receivedResponseBody)') {
      const { requestId, ...requestInfo } = message.params;
      recordNetworkResponse(requestId, requestInfo);
      return true;
    }

    return false;
  }

  handleDebuggerMessage(message: DebuggerRequest<NetworkGetResponseBody>) {
    if (
      message.method === 'Network.getResponseBody' &&
      this.storage.has(message.params.requestId)
    ) {
      return this.sendToDebugger<DeviceResponse<NetworkGetResponseBody>>({
        id: message.id,
        result: this.storage.get(message.params.requestId)!,
      });
    }

    return false;
  }
}

/** Custom message to transfer the response body data to the proxy */
export type NetworkReceivedResponseBody = CdpMessage<
  'Expo(Network.receivedResponseBody)',
  Protocol.Network.GetResponseBodyRequest & Protocol.Network.GetResponseBodyResponse,
  never
>;

/** @see https://chromedevtools.github.io/devtools-protocol/1-2/Network/#method-getResponseBody */
export type NetworkGetResponseBody = CdpMessage<
  'Network.getResponseBody',
  Protocol.Network.GetResponseBodyRequest,
  Protocol.Network.GetResponseBodyResponse
>;
