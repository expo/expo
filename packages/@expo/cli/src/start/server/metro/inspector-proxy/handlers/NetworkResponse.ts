import type { Protocol } from 'devtools-protocol';

import { ExpoDebuggerInfo } from '../device';
import {
  CdpMessage,
  InspectorHandler,
  DeviceRequest,
  DebuggerRequest,
  DebuggerResponse,
  DeviceResponse,
} from './types';

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
    { socket }: ExpoDebuggerInfo
  ) {
    if (
      message.method === 'Network.getResponseBody' &&
      this.storage.has(message.params.requestId)
    ) {
      const response: DeviceResponse<NetworkGetResponseBody> = {
        id: message.id,
        result: this.storage.get(message.params.requestId)!,
      };

      socket.send(JSON.stringify(response));
      return true;
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
