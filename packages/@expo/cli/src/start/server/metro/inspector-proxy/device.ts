import type { DebuggerInfo, Device as MetroDevice } from 'metro-inspector-proxy';
import type WS from 'ws';

import {
  NetworkResponseHandler,
  NetworkReceivedResponseBody,
  NetworkGetResponseBody,
} from './messages/NetworkRespose';
import { DeviceRequest, DebuggerRequest } from './messages/types';

type KnownDeviceRequests = DeviceRequest<NetworkReceivedResponseBody>;
type KnownDebuggerRequests = DebuggerRequest<NetworkGetResponseBody>;

export function createInspectorDeviceClass(MetroDeviceClass: typeof MetroDevice) {
  return class ExpoInspectorDevice extends MetroDeviceClass {
    networkResponseBodyHandler = new NetworkResponseHandler();

    onDeviceMessage(request: KnownDeviceRequests, debuggerInfo: DebuggerInfo): void {
      switch (request.method) {
        case 'Expo(Network.receivedResponseBody)':
          return this.networkResponseBodyHandler.onDeviceMessage(request);
      }
    }

    onDebuggerMessage(request: KnownDebuggerRequests, debuggerInfo: DebuggerInfo, socket: WS): any {
      switch (request.method) {
        case 'Network.getResponseBody':
          return this.networkResponseBodyHandler.onDebuggerMessage(request);
      }
    }

    /** Hook into the message life cycle to answer more complex CDP messages */
    _processMessageFromDevice(message: DeviceRequest<any>, debuggerInfo: DebuggerInfo) {
      this.onDeviceMessage(message, debuggerInfo);
      return super._processMessageFromDevice(message, debuggerInfo);
    }

    /** Hook into the message life cycle to answer more complex CDP messages */
    _interceptMessageFromDebugger(
      request: DebuggerRequest<any>,
      debuggerInfo: DebuggerInfo,
      socket: WS
    ) {
      const result = this.onDebuggerMessage(request, debuggerInfo, socket);
      return result
        ? { id: request.id, result }
        : super._interceptMessageFromDebugger(request, debuggerInfo, socket);
    }
  };
}
