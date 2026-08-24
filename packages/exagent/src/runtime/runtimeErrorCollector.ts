// @ref llp/0005-runtime-loop-tools.rfc.md
// Collects runtime errors the app reports over the debugger protocol during a time window.
//
// Both sources are captured on purpose: React Native delivers some uncaught errors through
// `Runtime.exceptionThrown` and others through the console path, and which one is used differs
// per React Native version (observed live, 2026-08-22).
import type CdpMessageType from 'devtools-protocol';
import { type WebSocket } from 'ws';

import { CdpClient, type CdpClientOptions } from './cdpClient';
import {
  cdpStackFrames,
  formatCdpConsoleArgs,
  formatCdpExceptionDetails,
  formatCdpStackTrace,
} from './cdpFormat';
import { debugEvent } from './events';
import {
  formatStackFrames,
  parseStackFrames,
  splitTextStack,
  type StackFrame,
} from './symbolicate';

/** A single runtime error reported by the running app. */
export interface RuntimeErrorRecord {
  /**
   * Where the error came from: an uncaught exception (the red screen) or a `console.error` call.
   */
  source: 'exception' | 'console';

  /** Epoch timestamp in milliseconds, as the runtime reported it. */
  timestamp: number;

  /** Error message. */
  message: string;

  /**
   * Stack, one frame per line, when the runtime reported one.
   *
   * Rendered from {@link frames} once the dev server has mapped them onto project files, so what a
   * reader sees is `src/app/index.tsx:42:13` rather than an offset into a bundle.
   */
  stack?: string;

  /**
   * The frames behind {@link stack}, so a caller does not have to parse the text back apart.
   *
   * Present whenever the runtime reported a stack at all. `file` is project-relative for a frame
   * the dev server mapped into this project, absolute for one it mapped elsewhere, and the bundle
   * URL with its query string dropped for one it could not map.
   */
  frames?: StackFrame[];

  /** Whether the dev server mapped any frame of this stack onto a file on disk. */
  symbolicated?: boolean;

  /** Source location as `url:line:column`, when the runtime reported a url. */
  location?: string;
}

export interface CdpRuntimeErrorCollectorConfig extends CdpClientOptions {
  /** How long to listen for errors before resolving, in milliseconds (default: 2000). */
  durationMs?: number;

  /** How long to wait for the debugger connection to open, in milliseconds (default: 2000). */
  timeoutMs?: number;
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: any;
}

/**
 * Collects runtime errors from the running app over a time window, over the debugger protocol.
 *
 * Kept separate from log collection because errors carry a stack and a source location, while
 * logs are flattened to text lines.
 */
export class CdpRuntimeErrorCollector {
  public readonly name = 'cdp-runtime-errors';
  private clientWebSocketDebuggerUrl?: string;

  constructor(private readonly config: CdpRuntimeErrorCollectorConfig) {}

  get metadata(): Record<string, unknown> {
    return {
      metroUrl: this.config.metroUrl,
      webSocketDebuggerUrl: this.clientWebSocketDebuggerUrl ?? '',
    };
  }

  /**
   * Listens for runtime errors for `durationMs` and resolves with the errors seen in that window.
   *
   * Rejects when the app cannot be reached, so callers can tell "no errors" from "not connected".
   */
  async collectAsync(): Promise<RuntimeErrorRecord[]> {
    const {
      metroUrl,
      targetSelector,
      createWebSocket,
      targetRetryMs,
      durationMs = 2000,
      timeoutMs = 2000,
    } = this.config;

    const client = new CdpClient({ metroUrl, targetSelector, createWebSocket, targetRetryMs });
    const ws: WebSocket = await client.createWebSocketAsync();
    this.clientWebSocketDebuggerUrl = client.getWebSocketDebuggerUrl();

    const errors: RuntimeErrorRecord[] = [];
    let requestId = 0;

    return new Promise<RuntimeErrorRecord[]>((resolve, reject) => {
      let settled = false;
      let timeoutHandle: NodeJS.Timeout;
      let collectionHandle: NodeJS.Timeout;

      const settle = (finalize: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutHandle);
        clearTimeout(collectionHandle);
        finalize();
      };

      timeoutHandle = setTimeout(() => {
        settle(() => {
          reject(
            new Error(
              `The debugger connection to the app did not open within ${timeoutMs}ms. Make sure the app is running and connected to the dev server.`
            )
          );
          ws.close();
        });
      }, timeoutMs);

      ws.on('open', () => {
        clearTimeout(timeoutHandle);

        ws.send(JSON.stringify({ id: ++requestId, method: 'Runtime.enable' }));

        collectionHandle = setTimeout(() => {
          settle(() => {
            ws.send(JSON.stringify({ id: ++requestId, method: 'Runtime.disable' }));
            // Give a brief moment for the disable command to send before closing.
            setTimeout(() => {
              ws.close();
              resolve(errors);
            }, 100);
          });
        }, durationMs);
      });

      ws.on('error', (error) => {
        settle(() => {
          reject(error);
          ws.close();
        });
      });

      ws.on('close', () => {
        settle(() => resolve(errors));
      });

      ws.on('message', (data) => {
        try {
          const message: CdpMessage = JSON.parse(data.toString());
          const record = parseRuntimeErrorMessage(message);
          if (record) {
            errors.push(record);
          }
        } catch (error) {
          debugEvent('cdp_parse_failed', {
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      });
    });
  }
}

const ERROR_CONSOLE_TYPES = new Set(['error', 'assert']);

/** Turns a CDP event into a runtime error record, or returns null when the event is not an error. */
export function parseRuntimeErrorMessage(message: CdpMessage): RuntimeErrorRecord | null {
  if (message.method === 'Runtime.exceptionThrown') {
    const params = (message.params ?? {}) as CdpMessageType.Runtime.ExceptionThrownEvent;
    if (!params.exceptionDetails) {
      return null;
    }
    const { message: text, stack, location } = formatCdpExceptionDetails(params.exceptionDetails);
    return {
      source: 'exception',
      timestamp: params.timestamp || Date.now(),
      message: text,
      stack,
      // Structured frames when the runtime sent them, and the text stack read back apart when the
      // stack only exists inside the exception's description — both need symbolicating.
      frames: framesOf(params.exceptionDetails.stackTrace, stack),
      location,
    };
  }

  if (message.method === 'Runtime.consoleAPICalled') {
    const params = (message.params ?? {}) as CdpMessageType.Runtime.ConsoleAPICalledEvent;
    if (!ERROR_CONSOLE_TYPES.has(params.type)) {
      return null;
    }
    // React Native reports a thrown error through the console path as one string with the error's
    // own frames inside it. Those name the project function that threw, while `stackTrace`
    // describes the console machinery that reported it — so the message's stack wins when it has
    // one, and is lifted out to be symbolicated like any other.
    const { message: text, frames: embedded } = splitTextStack(formatCdpConsoleArgs(params.args));
    return {
      source: 'console',
      timestamp: params.timestamp || Date.now(),
      message: text,
      stack: embedded.length > 0 ? formatStackFrames(embedded) : formatCdpStackTrace(params.stackTrace),
      frames: embedded.length > 0 ? embedded : framesOf(params.stackTrace, undefined),
    };
  }

  return null;
}

/** The frames of a stack, whichever of the two ways the runtime reported it. */
function framesOf(
  stackTrace: CdpMessageType.Runtime.StackTrace | undefined,
  textStack: string | undefined
): StackFrame[] | undefined {
  const frames = cdpStackFrames(stackTrace);
  if (frames.length > 0) {
    return frames;
  }
  const parsed = textStack == null ? [] : parseStackFrames(textStack);
  return parsed.length > 0 ? parsed : undefined;
}
