import type { Protocol } from 'devtools-protocol';
import type { DebuggerInfo } from 'metro-inspector-proxy';

import {
  CdpMessage,
  DebuggerRequest,
  DeviceRequest,
  DeviceResponse,
  InspectorHandler,
} from './types';

/**
 * "4294967295" is decimal for "0xffffffff", describing an invalid script id.
 * @see https://github.com/facebook/hermes/issues/168#issuecomment-568809021
 */
const HERMES_INVALID_SCRIPT_ID = '4294967295';
const HERMES_NATIVE_FUNCTION_NAME = '(native)';

export class VscodeCompatHandler implements InspectorHandler {
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
    if (
      message.method === 'Debugger.setBreakpointByUrl' &&
      message.params.urlRegex?.startsWith('file:\\/\\/http')
    ) {
      // Avoid `urlRegex` to accidentally bind to the wrong location, even when the `url` is invalid
      message.params.url = message.params.urlRegex;
      delete message.params.urlRegex;
    }

    return false;
  }

  onDeviceMessage(message: DeviceResponse<RuntimeGetProperties> | DeviceRequest<DebuggerPaused>) {
    // Vscode doesn't seem to work nicely with missing `description` fields on `RemoteObject` instances.
    // See: https://github.com/microsoft/vscode-js-debug/issues/1583
    if ('id' in message && this.interceptGetProperties.has(message.id)) {
      this.interceptGetProperties.delete(message.id);

      // Force-fully format the properties description to be an empty string
      // See: https://github.com/facebook/hermes/issues/114
      for (const item of message.result.result ?? []) {
        if (item.value) {
          item.value.description = item.value.description ?? '';
        }
      }
    }

    // Hermes adds traces of JSI to the callFrames, which are refering to native code.
    // It doesn't make sense to show these to the user, so we filter them out.
    if ('method' in message && message.method === 'Debugger.paused') {
      message.params.callFrames = message.params.callFrames.filter(
        (frame) =>
          frame.location.scriptId !== HERMES_INVALID_SCRIPT_ID &&
          frame.functionName !== HERMES_NATIVE_FUNCTION_NAME
      );
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Debugger/#method-setBreakpoint */
export type DebuggerPaused = CdpMessage<'Debugger.paused', Protocol.Debugger.PausedEvent, never>;

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
