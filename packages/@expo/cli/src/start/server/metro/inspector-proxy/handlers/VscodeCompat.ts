import type { Protocol } from 'devtools-protocol';
import type { DebuggerInfo } from 'metro-inspector-proxy';

import { CdpMessage, DebuggerRequest, DeviceResponse, InspectorHandler } from './types';

export class VscodeCompatHandler implements InspectorHandler {
  /** Keep track of device messages to intercept, by request id */
  interceptDeviceMessage = new Set<number>();

  onDebuggerMessage(
    message:
      | DebuggerRequest<DebuggerGetPossibleBreakpoints>
      | DebuggerRequest<RuntimeGetProperties>,
    { socket }: Pick<DebuggerInfo, 'socket'>
  ) {
    // Hermes doesn't seem to handle this request, but `locations` have to be returned.
    // Respond with an empty location to make it "spec compliant" with Chrome DevTools.
    if (message.method === 'Debugger.getPossibleBreakpoints') {
      const response: DeviceResponse<DebuggerGetPossibleBreakpoints> = {
        id: message.id,
        result: { locations: [] },
      };
      socket.send(JSON.stringify(response));
      return true;
    }

    // Vscode doesn't seem to work nicely with missing `description` fields on `RemoteObject` instances.
    // See: https://github.com/microsoft/vscode-js-debug/issues/1583
    if (message.method === 'Runtime.getProperties') {
      this.interceptDeviceMessage.add(message.id);
    }

    return false;
  }

  onDeviceMessage(message: DeviceResponse<RuntimeGetProperties>) {
    // Vscode doesn't seem to work nicely with missing `description` fields on `RemoteObject` instances.
    // See: https://github.com/microsoft/vscode-js-debug/issues/1583
    if (this.interceptDeviceMessage.has(message.id)) {
      this.interceptDeviceMessage.delete(message.id);

      // Force-fully format the properties description to be an empty string
      for (const item of message.result.result ?? []) {
        if (item.value) {
          item.value.description = item.value.description ?? '';
        }
      }
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Debugger/#method-getPossibleBreakpoints */
export type DebuggerGetPossibleBreakpoints = CdpMessage<
  'Debugger.getPossibleBreakpoints',
  Protocol.Debugger.GetPossibleBreakpointsRequest,
  Protocol.Debugger.GetPossibleBreakpointsResponse
>;

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Runtime/#method-getProperties */
export type RuntimeGetProperties = CdpMessage<
  'Runtime.getProperties',
  Protocol.Runtime.GetPropertiesRequest,
  Protocol.Runtime.GetPropertiesResponse
>;
