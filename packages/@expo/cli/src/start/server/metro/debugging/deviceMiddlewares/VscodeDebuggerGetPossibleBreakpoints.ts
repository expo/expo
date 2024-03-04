import Protocol from 'devtools-protocol';

import { CdpMessage, DebuggerRequest, DeviceMiddleware, DeviceResponse } from './types';
import { getDebuggerType } from './utils';

/**
 * Hermes doesn't seem to handle this request, but `locations` have to be returned.
 * Respond with an empty location to make it "spec compliant" with Chrome DevTools.
 */
export class VscodeDebuggerGetPossibleBreakpointsMiddleware extends DeviceMiddleware {
  isEnabled() {
    return getDebuggerType(this.debuggerInfo.userAgent) === 'vscode';
  }

  handleDebuggerMessage(message: DebuggerRequest<DebuggerGetPossibleBreakpoints>) {
    if (message.method === 'Debugger.getPossibleBreakpoints') {
      return this.sendToDebugger<DeviceResponse<DebuggerGetPossibleBreakpoints>>({
        id: message.id,
        result: { locations: [] },
      });
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
