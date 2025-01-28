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

export class NetworkResponseHandler extends MessageHandler {
  /** All known responses, mapped by request id */
  storage = NETWORK_RESPONSE_STORAGE;

  isEnabled() {
    return this.page.capabilities.nativeNetworkInspection !== true;
  }

  handleDeviceMessage(message: DeviceRequest<NetworkReceivedResponseBody>) {
    if (message.method === 'Expo(Network.receivedResponseBody)') {
      const { requestId, ...requestInfo } = message.params;
      this.storage.set(requestId, requestInfo);
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
