import type { Protocol } from 'devtools-protocol';
import type { DebuggerInfo } from 'metro-inspector-proxy';

import { CdpMessage, DebuggerRequest, DeviceResponse, InspectorHandler } from './types';

export class VscodeCompatHandler implements InspectorHandler {
  /** Only enable this handler for vscode debugging sessions */
  debuggerType = 'vscode' as const;

  /** Keep track of `Runtime.getProperties` responses to intercept, by request id */
  interceptGetProperties = new Set<number>();

  onDebuggerMessage(
    message:
      | DebuggerRequest<DebuggerGetPossibleBreakpoints>
      | DebuggerRequest<DebuggerSetBreakpointByUrl>
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
      this.interceptGetProperties.add(message.id);
    }

    // Hermes and vscode have trouble setting breakpoints by `urlRegex` through `Debugger.setBreakpointByUrl`.
    // Vscode adds `file://` to a URL containing `http://`, which confuses Hermes and sets it to the wrong location.
    // Hermes needs to create the breakpoint to get the proper ID, but it must be unbounded.
    // Once the sourcemap is loaded, vscode will rebind the unbounded breakpoint to the correct location (using `Debugger.setBreakpoint`).
    if (message.method === 'Debugger.setBreakpointByUrl' && message.params.urlRegex) {
      // Explicitly force the breakpoint to be unbounded
      message.params.url = 'file://__invalid_url__';
      delete message.params.urlRegex;
    }

    return false;
  }

  onDeviceMessage(message: DeviceResponse<RuntimeGetProperties>) {
    // Vscode doesn't seem to work nicely with missing `description` fields on `RemoteObject` instances.
    // See: https://github.com/microsoft/vscode-js-debug/issues/1583
    if ('id' in message && this.interceptGetProperties.has(message.id)) {
      this.interceptGetProperties.delete(message.id);

      for (const item of message.result.result ?? []) {
        // Force-fully format the properties description to be an empty string
        // See: https://github.com/facebook/hermes/issues/114
        if (item.value) {
          item.value.description = item.value.description ?? '';
        }

        // Avoid passing the `objectId` for symbol types.
        // When collapsing in vscode, it will fetch information about the symbol using the `objectId`.
        // The `Runtime.getProperties` request of the symbol hard-crashes Hermes.
        if (item.value?.type === 'symbol' && item.value.objectId) {
          delete item.value.objectId;
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

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Debugger/#method-setBreakpointByUrl */
export type DebuggerSetBreakpointByUrl = CdpMessage<
  'Debugger.setBreakpointByUrl',
  Protocol.Debugger.SetBreakpointByUrlRequest,
  Protocol.Debugger.SetBreakpointByUrlResponse
>;

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Runtime/#method-getProperties */
export type RuntimeGetProperties = CdpMessage<
  'Runtime.getProperties',
  Protocol.Runtime.GetPropertiesRequest,
  Protocol.Runtime.GetPropertiesResponse
>;
