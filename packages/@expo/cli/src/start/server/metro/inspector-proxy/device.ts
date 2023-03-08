import type { DebuggerInfo, Device as MetroDevice } from 'metro-inspector-proxy';
import type WS from 'ws';

import { NetworkResponseHandler } from './handlers/NetworkResponse';
import { DeviceRequest, InspectorHandler, DebuggerRequest } from './handlers/types';

export function createInspectorDeviceClass(MetroDeviceClass: typeof MetroDevice) {
  return class ExpoInspectorDevice extends MetroDeviceClass implements InspectorHandler {
    /** All handlers that should be used to intercept or reply to CDP events */
    public handlers: InspectorHandler[] = [new NetworkResponseHandler()];

    onDeviceMessage(message: any, info: DebuggerInfo): boolean {
      return this.handlers.some((handler) => handler.onDeviceMessage?.(message, info) ?? false);
    }

    onDebuggerMessage(message: any, info: DebuggerInfo): boolean {
      return this.handlers.some((handler) => handler.onDebuggerMessage?.(message, info) ?? false);
    }

    /** Hook into the message life cycle to answer more complex CDP messages */
    async _processMessageFromDevice(message: DeviceRequest<any>, info: DebuggerInfo) {
      if (!this.onDeviceMessage(message, info)) {
        await super._processMessageFromDevice(message, info);
      }
    }

    /** Hook into the message life cycle to answer more complex CDP messages */
    _interceptMessageFromDebugger(
      request: DebuggerRequest,
      info: DebuggerInfo,
      socket: WS
    ): boolean {
      // Note, `socket` is the exact same as `info.socket`
      if (this.onDebuggerMessage(request, info)) {
        return true;
      }

      return super._interceptMessageFromDebugger(request, info, socket);
    }
  };
}
