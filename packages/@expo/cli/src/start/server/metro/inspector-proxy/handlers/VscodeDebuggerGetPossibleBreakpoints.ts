import Protocol from 'devtools-protocol';
import { DebuggerInfo } from 'metro-inspector-proxy';

import { CdpMessage, DebuggerRequest, DeviceResponse, InspectorHandler } from './types';

/**
 * Hermes doesn't seem to handle this request, but `locations` have to be returned.
 * Respond with an empty location to make it "spec compliant" with Chrome DevTools.
 */
export class VscodeDebuggerGetPossibleBreakpointsHandler implements InspectorHandler {
  onDebuggerMessage(
    message: DebuggerRequest<DebuggerGetPossibleBreakpoints>,
    { socket }: DebuggerInfo
  ): boolean {
    if (message.method === 'Debugger.getPossibleBreakpoints') {
      const response: DeviceResponse<DebuggerGetPossibleBreakpoints> = {
        id: message.id,
        result: { locations: [] },
      };
      socket.send(JSON.stringify(response));
      return true;
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
