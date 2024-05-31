import type Protocol from 'devtools-protocol';

import { MessageHandler } from '../MessageHandler';
import { getDebuggerType } from '../getDebuggerType';
import type { CdpMessage, DebuggerRequest } from '../types';

/**
 * Hermes and vscode have trouble setting breakpoints by `urlRegex` through `Debugger.setBreakpointByUrl`.
 * Vscode adds `file://` to a URL containing `http://`, which confuses Hermes and sets it to the wrong location.
 * Hermes needs to create the breakpoint to get the proper ID, but it must be unbounded.
 * Once the sourcemap is loaded, vscode will rebind the unbounded breakpoint to the correct location (using `Debugger.setBreakpoint`).
 */
export class VscodeDebuggerSetBreakpointByUrlHandler extends MessageHandler {
  isEnabled() {
    return getDebuggerType(this.debugger.userAgent) === 'vscode';
  }

  handleDebuggerMessage(message: DebuggerRequest<DebuggerSetBreakpointByUrl>) {
    if (message.method === 'Debugger.setBreakpointByUrl' && message.params.urlRegex) {
      // Explicitly force the breakpoint to be unbounded
      message.params.url = 'file://__invalid_url__';
      delete message.params.urlRegex;
    }

    return false;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/v8/Debugger/#method-setBreakpointByUrl */
export type DebuggerSetBreakpointByUrl = CdpMessage<
  'Debugger.setBreakpointByUrl',
  Protocol.Debugger.SetBreakpointByUrlRequest,
  Protocol.Debugger.SetBreakpointByUrlResponse
>;
