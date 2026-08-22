// @ref llp/0005-runtime-loop-tools.rfc.md
// Talks to the running app over the Chrome DevTools Protocol, through the dev server's inspector
// proxy. This is a process-boundary client (llp/0001 §Constraints item 5): it speaks the dev
// server's own protocol over HTTP and WebSocket, and never imports `@expo/cli` internals.
import type CdpMessageType from 'devtools-protocol';
import { WebSocket } from 'ws';

import { formatCdpExceptionDetails, stringifyCdpValue } from './cdpFormat';
import { debugEvent } from './events';

/**
 * Metro's inspector proxy rejects WebSocket handshakes without a same-origin `Origin`
 * header (HTTP 401), so every connection must present the dev server's own origin.
 * Derive it from the `ws://`/`wss://` debugger URL.
 */
export function deriveInspectorOrigin(webSocketDebuggerUrl: string): string {
  const url = new URL(webSocketDebuggerUrl);
  return `${url.protocol === 'wss:' ? 'https:' : 'http:'}//${url.host}`;
}

export function createInspectorWebSocket(webSocketDebuggerUrl: string): WebSocket {
  return new WebSocket(webSocketDebuggerUrl, {
    headers: { origin: deriveInspectorOrigin(webSocketDebuggerUrl) },
  });
}

/** JSON-RPC code for a method the peer does not implement. */
export const RPC_METHOD_NOT_FOUND = -32601;

/**
 * A request the runtime answered with a JSON-RPC error.
 *
 * The code is carried instead of being flattened into the message because callers branch on it:
 * "this runtime has no handler for the method" and "this runtime refused the call" need different
 * answers, and only the code tells them apart.
 */
export class CdpRequestError extends Error {
  readonly isCdpRequestError = true;

  constructor(
    message: string,
    public readonly rpcCode?: number
  ) {
    super(message);
    this.name = 'CdpRequestError';
  }
}

/**
 * Whether the runtime answered that it does not implement the method that was called.
 *
 * Not a failure of the request: the runtime is reachable and healthy, it simply carries no handler.
 * Expo Go on Android answers `Runtime.evaluate` this way [observed — Expo Go 57.0.9, 2026-08-22].
 */
export function isMethodNotFoundError(error: unknown): boolean {
  return error instanceof CdpRequestError && error.rpcCode === RPC_METHOD_NOT_FOUND;
}

export interface CdpTarget {
  id: string;
  appId: string;
  deviceName: string;
  description: string;
  type: string;
  title: string;
  devtoolsFrontendUrl: string;
  webSocketDebuggerUrl: string;
  reactNative?: {
    capabilities?: {
      nativePageReloads?: boolean;
      [key: string]: unknown;
    };
    logicalDeviceId: string;
  };
  [key: string]: unknown;
}

export type CdpTargetSelector = (targets: CdpTarget[]) => Promise<CdpTarget | null>;

export interface CdpEvaluateOptions {
  /** Wait for a returned promise to settle and report the settled value (default: true). */
  awaitPromise?: boolean;

  /** Ask the runtime for the value itself instead of a remote object handle (default: true). */
  returnByValue?: boolean;

  /** How long to wait for the runtime to answer, in milliseconds (default: 5000). */
  timeoutMs?: number;
}

export interface CdpEvaluateResult {
  /** Value the expression returned, when it did not throw. */
  value?: unknown;

  /** Type the runtime reported for the value, e.g. `number`, `object`, `undefined`. */
  type?: string;

  /**
   * Description the runtime reported for values it cannot serialize, e.g. `function foo() {}`.
   */
  description?: string;

  /** Message of the exception the expression threw, when it threw. */
  exceptionText?: string;

  /** Stack of the exception the expression threw, when the runtime reported one. */
  exceptionStack?: string;
}

export interface CdpClientOptions {
  /** Dev server (Metro) URL, without a trailing slash, e.g. `http://127.0.0.1:8081`. */
  metroUrl: string;
  targetSelector?: CdpTargetSelector;
  createWebSocket?: (url: string) => WebSocket;
}

export class CdpClient {
  private resolvedWebSocketDebuggerUrl?: string;

  constructor(private readonly options: CdpClientOptions) {}

  private async listTargetsAsync(): Promise<CdpTarget[]> {
    const response = await fetch(`${this.options.metroUrl}/json/list`);
    if (!response.ok) {
      throw new Error(`Failed to fetch debugger targets: ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected debugger targets payload: expected an array.');
    }

    return data as CdpTarget[];
  }

  private async resolveWebSocketDebuggerUrlAsync(): Promise<string> {
    if (this.resolvedWebSocketDebuggerUrl) {
      return this.resolvedWebSocketDebuggerUrl;
    }

    const targets = await this.listTargetsAsync();
    // The default selector probes each target over its own connection, so it gets the same socket
    // factory as the client: a caller that injected one gets it honored everywhere.
    const selector =
      this.options.targetSelector ??
      createDefaultTargetSelector({ createWebSocket: this.options.createWebSocket });
    const target = await selector(targets);
    if (!target) {
      throw new Error('No target found.');
    }
    this.resolvedWebSocketDebuggerUrl = target.webSocketDebuggerUrl;
    return this.resolvedWebSocketDebuggerUrl;
  }

  async createWebSocketAsync(): Promise<WebSocket> {
    const webSocketDebuggerUrl = await this.resolveWebSocketDebuggerUrlAsync();
    const factory = this.options.createWebSocket ?? createInspectorWebSocket;

    try {
      return factory(webSocketDebuggerUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create CDP WebSocket connection: ${message}`);
    }
  }

  getWebSocketDebuggerUrl(): string {
    return this.resolvedWebSocketDebuggerUrl ?? '';
  }

  /**
   * Evaluates a JavaScript expression in the connected runtime and resolves with its value,
   * or with the exception the expression threw.
   *
   * Rejects when the runtime cannot be reached, refuses the request, or does not answer in time.
   */
  async evaluateAsync(
    expression: string,
    options: CdpEvaluateOptions = {}
  ): Promise<CdpEvaluateResult> {
    const { awaitPromise = true, returnByValue = true, timeoutMs = 5000 } = options;
    const ws = await this.createWebSocketAsync();
    const REQUEST_ID = 1;

    return new Promise<CdpEvaluateResult>((resolve, reject) => {
      let settled = false;
      let timeoutHandle: NodeJS.Timeout;

      const settle = (finalize: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timeoutHandle);
        finalize();
        ws.close();
      };

      timeoutHandle = setTimeout(() => {
        settle(() =>
          reject(
            new Error(
              `The app did not answer the evaluate request within ${timeoutMs}ms. The JavaScript thread may be blocked, or the expression may still be pending. Try a smaller expression or a longer timeout.`
            )
          )
        );
      }, timeoutMs);

      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            id: REQUEST_ID,
            method: 'Runtime.evaluate',
            params: {
              expression,
              awaitPromise,
              returnByValue,
              includeCommandLineAPI: false,
              generatePreview: false,
            },
          })
        );
      });

      ws.on('error', (error) => {
        debugEvent('cdp_socket_error', {
          url: this.getWebSocketDebuggerUrl(),
          error: error.message,
        });
        settle(() => reject(error));
      });

      ws.on('close', () => {
        settle(() =>
          reject(new Error('The debugger connection closed before the app answered the request.'))
        );
      });

      ws.on('message', (data) => {
        debugEvent('cdp_message', {
          url: this.getWebSocketDebuggerUrl(),
          message: data.toString(),
        });
        let message: { id?: number; result?: unknown; error?: { message?: string; code?: number } };
        try {
          message = JSON.parse(data.toString());
        } catch (error) {
          settle(() => reject(error));
          return;
        }

        if (message.id !== REQUEST_ID) {
          return;
        }

        if (message.error) {
          settle(() =>
            reject(
              new CdpRequestError(
                `The app rejected the evaluate request: ${message.error?.message ?? 'unknown error'}`,
                message.error?.code
              )
            )
          );
          return;
        }

        settle(() =>
          resolve(parseEvaluateResponse(message.result as CdpMessageType.Runtime.EvaluateResponse))
        );
      });
    });
  }
}

/** Converts a `Runtime.evaluate` response into a value or an exception description. */
export function parseEvaluateResponse(
  response: CdpMessageType.Runtime.EvaluateResponse | undefined
): CdpEvaluateResult {
  if (!response) {
    return { type: 'undefined' };
  }

  const { result, exceptionDetails } = response;
  if (exceptionDetails) {
    const { message, stack, location } = formatCdpExceptionDetails(exceptionDetails);
    return {
      exceptionText: location ? `${message} (${location})` : message,
      exceptionStack: stack,
    };
  }

  return {
    value: result?.value,
    type: result?.type,
    description:
      result?.value === undefined && result?.description != null
        ? stringifyCdpValue(result.description)
        : undefined,
  };
}

const HIDE_FROM_INSPECTOR_ENV = 'globalThis.__expo_hide_from_inspector__';

/**
 * Build the default target selector: pick the app page to talk to, which is the first target that
 * reloads natively and does not ask to be hidden from the inspector. Metro also lists stale and
 * internal pages, which would answer with values from a runtime that is no longer on screen.
 *
 * The probe asks the runtime for a global, so it needs `Runtime.evaluate`. A runtime that has no
 * evaluate handler therefore cannot be classified at all, and "cannot classify" must not read as
 * "exclude": Expo Go on Android answers `Runtime.evaluate` with `-32601`
 * [observed — Expo Go 57.0.9 on an Android emulator, 2026-08-22], and excluding it made *every*
 * runtime command report "No target found" there, including `runtime:errors` and `runtime:network`,
 * which never evaluate anything. Such a target is kept as a fallback instead: it is used when no
 * target answered the probe, so a runtime that can be driven still wins when there is one.
 *
 * @param options.createWebSocket socket factory for the probe, so the probe is injectable in tests
 * and honors a factory the caller passed to {@link CdpClient}.
 */
export function createDefaultTargetSelector(options?: {
  createWebSocket?: (url: string) => WebSocket;
}): CdpTargetSelector {
  return async (targets) => {
    const undetermined: CdpTarget[] = [];

    for (const target of targets) {
      const capabilities = target.reactNative?.capabilities ?? {};
      if (capabilities.nativePageReloads !== true) {
        continue;
      }
      try {
        const hideFromInspector =
          (await evaluateJsFromCdpAsync(
            target.webSocketDebuggerUrl,
            HIDE_FROM_INSPECTOR_ENV,
            undefined,
            options
          )) !== undefined;
        if (hideFromInspector) {
          continue;
        }
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        if (isMethodNotFoundError(error)) {
          // The runtime is there and healthy, it just cannot answer this question.
          debugEvent('cdp_target_undetermined', { url: target.webSocketDebuggerUrl, reason });
          undetermined.push(target);
          continue;
        }
        // A target we cannot reach is skipped, not an error: another target may answer.
        debugEvent('cdp_target_skipped', { url: target.webSocketDebuggerUrl, reason });
        continue;
      }
      return target;
    }

    return undetermined[0] ?? null;
  };
}

/**
 * Pick the app page to talk to.
 *
 * @see {@link createDefaultTargetSelector}
 */
export const defaultTargetSelector: CdpTargetSelector = createDefaultTargetSelector();

/** Evaluates JavaScript in the app over a one-shot CDP connection. */
export function evaluateJsFromCdpAsync(
  webSocketDebuggerUrl: string,
  source: string,
  timeoutMs: number = 2000,
  options?: { createWebSocket?: (url: string) => WebSocket }
): Promise<string | undefined> {
  const REQUEST_ID = 0;
  let timeoutHandle: NodeJS.Timeout;

  return new Promise((resolve, reject) => {
    let settled = false;
    const factory = options?.createWebSocket ?? createInspectorWebSocket;
    const ws = factory(webSocketDebuggerUrl);

    timeoutHandle = setTimeout(() => {
      reject(new Error('Request timeout'));
      settled = true;
      ws.close();
    }, timeoutMs);

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          id: REQUEST_ID,
          method: 'Runtime.evaluate',
          params: { expression: source },
        })
      );
    });

    ws.on('error', (error) => {
      debugEvent('cdp_socket_error', { url: webSocketDebuggerUrl, error: error.message });
      reject(error);
      settled = true;
      clearTimeout(timeoutHandle);
      ws.close();
    });

    ws.on('close', () => {
      if (!settled) {
        reject(new Error('WebSocket closed before response was received.'));
        clearTimeout(timeoutHandle);
      }
    });

    ws.on('message', (data) => {
      debugEvent('cdp_message', { url: webSocketDebuggerUrl, message: data.toString() });
      try {
        const response = JSON.parse(data.toString());
        if (response.id === REQUEST_ID) {
          if (response.error) {
            reject(new CdpRequestError(response.error.message, response.error.code));
          } else if (response.result.result.type === 'string') {
            resolve(response.result.result.value);
          } else {
            resolve(undefined);
          }
          settled = true;
          clearTimeout(timeoutHandle);
          ws.close();
        }
      } catch (error) {
        reject(error);
        settled = true;
        clearTimeout(timeoutHandle);
        ws.close();
      }
    });
  });
}
