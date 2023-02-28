import {
  CdpMessage,
  InspectorHandler,
  DeviceRequest,
  DebuggerRequest,
  DebuggerResponse,
} from './types';

export type NetworkReceivedResponseBody = CdpMessage<
  'Expo(Network.receivedResponseBody)',
  {
    requestId: string;
    body: string;
    base64Encoded: boolean;
  }
>;

/** @see https://chromedevtools.github.io/devtools-protocol/1-2/Network/#method-getResponseBody */
export type NetworkGetResponseBody = CdpMessage<
  'Network.getResponseBody',
  { requestId: string },
  {
    body: string;
    base64Encoded: boolean;
  }
>;

export class NetworkResponseHandler
  implements InspectorHandler<NetworkReceivedResponseBody, NetworkGetResponseBody>
{
  /** All known responses, mapped by request id */
  storage = new Map<string, DebuggerResponse<NetworkGetResponseBody>>();

  onDeviceMessage(message: DeviceRequest<NetworkReceivedResponseBody>) {
    const { requestId, ...requestInfo } = message.params;
    this.storage.set(requestId, requestInfo);
  }

  onDebuggerMessage(message: DebuggerRequest<NetworkGetResponseBody>) {
    return this.storage.get(message.params.requestId);
  }
}
