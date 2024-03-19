import type Protocol from 'devtools-protocol';

import { MessageHandler } from '../MessageHandler';
import { getDebuggerType } from '../getDebuggerType';
import type { CdpMessage, DebuggerRequest, DeviceResponse } from '../types';

/**
 * Hermes doesn't seem to handle this request, but `locations` have to be returned.
 * Respond with an empty location to make it "spec compliant" with Chrome DevTools.
 */
export class VscodeDebuggerGetPossibleBreakpointsHandler extends MessageHandler {
  isEnabled() {
    return getDebuggerType(this.debugger.userAgent) === 'vscode';
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
