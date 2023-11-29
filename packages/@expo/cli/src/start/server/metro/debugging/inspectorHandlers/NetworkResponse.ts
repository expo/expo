import type { Protocol } from 'devtools-protocol';

import {
  CdpMessage,
  InspectorHandler,
  DebuggerMetadata,
  DeviceRequest,
  DebuggerRequest,
  DebuggerResponse,
  DeviceResponse,
} from './types';
import { respond } from './utils';

export class NetworkResponseHandler implements InspectorHandler {
  /** All known responses, mapped by request id */
  storage = new Map<string, DebuggerResponse<NetworkGetResponseBody>['result']>();

  onDeviceMessage(message: DeviceRequest<NetworkReceivedResponseBody>) {
    if (message.method === 'Expo(Network.receivedResponseBody)') {
      const { requestId, ...requestInfo } = message.params;
      this.storage.set(requestId, requestInfo);
      return true;
    }

    return false;
  }

  onDebuggerMessage(
    message: DebuggerRequest<NetworkGetResponseBody>,
    { socket }: DebuggerMetadata
  ) {
    if (
      message.method === 'Network.getResponseBody' &&
      this.storage.has(message.params.requestId)
    ) {
      return respond<DeviceResponse<NetworkGetResponseBody>>(socket, {
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
