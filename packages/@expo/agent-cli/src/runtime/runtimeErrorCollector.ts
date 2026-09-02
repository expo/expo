// @ref llp/0005-runtime-loop-tools.rfc.md
// Collects runtime errors the app reports over the debugger protocol during a time window.
//
// Both sources are captured on purpose: React Native delivers some uncaught errors through
// `Runtime.exceptionThrown` and others through the console path, and which one is used differs
// per React Native version (observed live, 2026-08-22).
import type CdpMessageType from 'devtools-protocol';
import { type WebSocket } from 'ws';

import { CdpClient, RPC_METHOD_NOT_FOUND, type CdpClientOptions } from './cdpClient';
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
   * Where the error came from.
   *
   * `exception` and `console` are the two debugger channels. `dev-server-log` is not a debugger
   * channel at all: it is a line the **dev server** printed, read back out of the detached log
   * (`src/dev/logErrors.ts`). It exists because Expo Go for Android has no CDP debugger, so the two
   * channels above are silent there while the dev server's log carries the same error, symbolicated
   * and with a code frame [friction run 6, F52]. A record from that source has no structured stack
   * and does not say which platform reported it — the log does not label one.
   */
  source: 'exception' | 'console' | 'dev-server-log';

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

  /**
   * Whether this record is an `Error` the app reported, rather than a line of text it logged.
   *
   * **This is what `source` cannot answer, and the reason it exists** [observed — 2026-08-24,
   * notesapp on SDK 57 in Expo Go on an iOS 26.5 simulator]. An uncaught `throw` on this runtime
   * does **not** arrive as `Runtime.exceptionThrown` at all: React Native catches it and reports it
   * through the console path, so it is `source: 'console'` exactly like a `console.error("hello")`
   * is. Three cases were measured side by side in one window:
   *
   * | what the app did              | `source`  | `message`               | the stack           |
   * | ----------------------------- | --------- | ----------------------- | ------------------- |
   * | `console.error("some text")`  | `console` | `some text`             | `console.js`, `backend.js` |
   * | `console.error(new Error(x))` | `console` | `Error: x`              | the project's own frame |
   * | `throw new Error(x)`          | `console` | `Error: x`              | the project's own frame |
   *
   * So the difference a gate can act on is not the source, it is whether the record carries **the
   * error's own stack**: React Native reports an Error through the console path as one string
   * holding the message *and* its frames, and `splitTextStack` is what lifts them out. A plain
   * text log has no such frames — the `stackTrace` CDP sends alongside describes the console
   * machinery that reported it, which names no file of this project.
   *
   * The limit, stated because it decides a gate's behaviour: **a logged Error and an uncaught one
   * are the same bytes here.** Nothing over this protocol tells them apart, so a consumer that
   * fails on this flag fails on `console.error(new Error(…))` too. That is the honest trade —
   * the alternative is a gate that passes a crash, which is worse than one that reports a
   * deliberate log with the record printed next to it.
   */
  isError?: boolean;

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
  error?: { message?: string; code?: number };
}

/**
 * What the runtime said, itself, about being able to answer a debugger at all.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §Android — friction run 6, F52 and F61.
 *
 * Expo Go for Android **acknowledges** the calls that open a window and then sends nothing: live,
 * `Runtime.enable` and `Network.enable` both answered `{}` and no app event ever followed
 * [observed — 2026-08-25, Expo Go on an Android emulator, SDK 57]. So an empty window there is not
 * evidence of a healthy app; it is the runtime having no debugger. Two things say so out loud, and
 * both are recorded because either alone could change between versions:
 *
 *  - `Runtime.evaluate` answers `-32601` (`Console.enable` too; `Runtime.enable`, `Log.enable`,
 *    `Network.enable` and `Debugger.enable` all answer `{}`);
 *  - `Log.entryAdded` carries `"The current JavaScript engine, HermesRuntime[RNBridgeless], does
 *    not support debugging over the Chrome DevTools Protocol."`
 *
 * On iOS the same probe answers `{"result":{"result":{"type":"number","value":1}}}` and the log
 * entry is absent, so this is a live distinction rather than a platform assumption.
 */
export interface RuntimeDebuggerCapability {
  /**
   * The runtime cannot report anything over this protocol, so an empty window proves nothing.
   *
   * Null when the probe did not finish — a socket that closed early, a window of zero.
   */
  blind: boolean | null;
  /** One clause naming what said so, for a report that has to justify a caveat. */
  evidence: string | null;
}

/** The sentence the runtime uses to announce that it has no CDP debugger. */
export const NO_CDP_DEBUGGER_ANNOUNCEMENT =
  'does not support debugging over the Chrome DevTools Protocol';

/** The expression the capability probe evaluates. Nothing about the app: only "does this answer". */
const CAPABILITY_EXPRESSION = '1';

/**
 * Collects runtime errors from the running app over a time window, over the debugger protocol.
 *
 * Kept separate from log collection because errors carry a stack and a source location, while
 * logs are flattened to text lines.
 */
export class CdpRuntimeErrorCollector {
  public readonly name = 'cdp-runtime-errors';
  private clientWebSocketDebuggerUrl?: string;

  /**
   * What the runtime said about its own debugger, filled in by {@link collectAsync}.
   *
   * A field rather than part of the return value, so every existing caller keeps its signature and
   * a caller that has to qualify an empty window can ask (F52).
   */
  public capability: RuntimeDebuggerCapability = { blind: null, evidence: null };

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
    const { durationMs = 2000, timeoutMs = 2000, ...clientOptions } = this.config;

    // @ref llp/0005-runtime-loop-tools.rfc.md §Android — F100.
    // Every `CdpClientOptions` key is forwarded, and that is the point: this used to name the four
    // it wanted and so silently dropped `platform` and `deviceIndex`, which both callers pass. The
    // result was `runtime:errors --android` reading the iOS runtime and reporting it as Android's —
    // not by accident, but because the default selector ranks a runtime that answers above one that
    // answers `-32601`, and Expo Go for Android is the second kind. A rest spread cannot go stale
    // the next time an option is added to the client.
    const client = new CdpClient(clientOptions);
    const ws: WebSocket = await client.createWebSocketAsync();
    this.clientWebSocketDebuggerUrl = client.getWebSocketDebuggerUrl();

    const errors: RuntimeErrorRecord[] = [];
    let requestId = 0;
    let capabilityRequestId = 0;
    // Starts as "answers the debugger" and is only ever moved by something the runtime said, so a
    // socket that closes early leaves `null` rather than an unearned verdict in either direction.
    this.capability = { blind: null, evidence: null };
    const sawEvidence = (blind: boolean, evidence: string) => {
      // The first answer wins, so a later `{}` cannot erase a `-32601`.
      if (this.capability.blind == null || (blind && !this.capability.blind)) {
        this.capability = { blind, evidence };
      }
    };

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
        // Two more openings, both for the capability probe rather than for the window. `Log.enable`
        // is where the runtime announces that it has no CDP debugger, and the evaluate is the
        // second, independent way of learning the same thing (F52). Neither adds an error record:
        // `parseRuntimeErrorMessage` only reads `Runtime.exceptionThrown` and `consoleAPICalled`.
        ws.send(JSON.stringify({ id: ++requestId, method: 'Log.enable' }));
        capabilityRequestId = ++requestId;
        ws.send(
          JSON.stringify({
            id: capabilityRequestId,
            method: 'Runtime.evaluate',
            params: { expression: CAPABILITY_EXPRESSION, returnByValue: true },
          })
        );

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

          // The runtime announcing itself, which is the clearest of the two signals: it is a
          // sentence written by the engine about the engine.
          const announced = readNoCdpAnnouncement(message);
          if (announced) {
            sawEvidence(true, announced);
          }
          if (message.id === capabilityRequestId && capabilityRequestId > 0) {
            sawEvidence(
              message.error?.code === RPC_METHOD_NOT_FOUND,
              message.error?.code === RPC_METHOD_NOT_FOUND
                ? `the runtime answered Runtime.evaluate with "method not found" (${RPC_METHOD_NOT_FOUND})`
                : `the runtime answered Runtime.evaluate, so it does carry a debugger`
            );
          }

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

/**
 * The runtime's own announcement that it has no CDP debugger, or null.
 *
 * It arrives on `Log.entryAdded` as a `warning`, in italics
 * [observed — 2026-08-25: `"The current JavaScript engine, [3mHermesRuntime[RNBridgeless][23m,
 * does not support debugging over the Chrome DevTools Protocol."`], so the text is matched on the
 * part that carries no formatting and no engine name.
 */
export function readNoCdpAnnouncement(message: CdpMessage): string | null {
  if (message.method !== 'Log.entryAdded') {
    return null;
  }
  const text = message.params?.entry?.text;
  return typeof text === 'string' && text.includes(NO_CDP_DEBUGGER_ANNOUNCEMENT)
    ? `the runtime announced over Log.entryAdded that it "${NO_CDP_DEBUGGER_ANNOUNCEMENT}"`
    : null;
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
      // An exception is an error by construction, whatever else is true of it.
      isError: true,
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
      stack:
        embedded.length > 0 ? formatStackFrames(embedded) : formatCdpStackTrace(params.stackTrace),
      frames: embedded.length > 0 ? embedded : framesOf(params.stackTrace, undefined),
      // The frames were inside the message, so the app reported an `Error` rather than logging a
      // line — which on this runtime is the only way an uncaught throw ever arrives. See the
      // field's own documentation for the three cases that were measured to settle this.
      isError: embedded.length > 0,
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
