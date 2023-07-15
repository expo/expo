import type { Protocol } from 'devtools-protocol';

import { CdpMessage, DebuggerRequest, InspectorHandler } from './types';

/**
 * When the debugger is attached to a device in debug mode, Hermes sends a `Debugger.scriptParsed` event for every HMR change.
 * Unfortunately, this stacks up inside Hermes and fires the events in reversed order.
 * This handler swallows outdated `Debugger.scriptParsed` events to prevent the debugger getting confused.
 */
export class DebuggerScriptParsedHandler implements InspectorHandler {
  /** Keep track of the last known script id */
  private highestKnownScriptId: number = -1;

  onDebuggerMessage(message: DebuggerRequest<DebuggerScriptParsed>) {
    if (message.method !== 'Debugger.scriptParsed') {
      return false;
    }

    const scriptId = parseInt(message.params.scriptId, 10);
    if (scriptId >= this.highestKnownScriptId) {
      this.highestKnownScriptId = scriptId;
      return false;
    }

    // Swallow the message to not confuse the debugger
    return true;
  }
}

/** @see https://chromedevtools.github.io/devtools-protocol/1-2/Debugger/#event-scriptParsed */
export type DebuggerScriptParsed = CdpMessage<
  'Debugger.scriptParsed',
  Protocol.Debugger.ScriptParsedEvent,
  never
>;
