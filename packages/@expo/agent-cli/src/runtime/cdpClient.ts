// @ref llp/0005-runtime-loop-tools.rfc.md
// Talks to the running app over the Chrome DevTools Protocol, through the dev server's inspector
// proxy. This is a process-boundary client (llp/0001 §Constraints item 5): it speaks the dev
// server's own protocol over HTTP and WebSocket, and never imports `@expo/cli` internals.
import type CdpMessageType from 'devtools-protocol';
import { WebSocket } from 'ws';

import type { NavigatePlatform } from '../navigate/device';
import { formatCdpExceptionDetails, stringifyCdpValue } from './cdpFormat';
import { debugEvent } from './events';
import {
  buildPromisePollExpression,
  buildPromiseReleaseExpression,
  createPromiseNonce,
  isPendingPromiseMarker,
  looksLikeWrapperSyntaxError,
  parseSettledPromiseSlot,
  wrapExpressionForPromises,
} from './promiseSettling';
import {
  buildDeviceNameIndexIfNeededAsync,
  scopeTargets,
  type DeviceNameIndex,
  type ScopedTargets,
} from './targetPlatform';

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

/**
 * How a promise the expression returned settled.
 *
 * @see ./promiseSettling — why this is read out of the app instead of out of CDP.
 */
export type CdpEvaluatedPromise =
  /** It resolved; the value is on the result, with the type the app reported for it. */
  | { state: 'fulfilled'; awaited: true; waitedMs: number }
  /** It rejected. The reason is here rather than on `exceptionText`: the expression itself
   * returned normally, and a caller that only reads `threw` must not miss the difference. */
  | {
      state: 'rejected';
      awaited: true;
      waitedMs: number;
      reason: { text: string; stack: string | null };
    }
  /** It was not awaited, because the caller passed `--no-await-promise`. */
  | { state: 'pending'; awaited: false };

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

  /**
   * How a returned promise settled, or undefined when the expression returned no thenable.
   *
   * `value`, `type` and `description` describe the *settled* value when this is `fulfilled`.
   */
  promise?: CdpEvaluatedPromise;
}

/**
 * A promise the expression returned did not settle inside the wait.
 *
 * Its own type because the recovery differs from every other evaluate failure: the app is healthy
 * and answering, and the two ways forward are a longer `--timeout` or not waiting at all.
 */
export class CdpPromisePendingError extends Error {
  readonly isCdpPromisePending = true;

  constructor(
    public readonly waitedMs: number,
    /** True when the app reloaded mid-wait, which drops the outcome instead of delaying it. */
    public readonly lost: boolean = false
  ) {
    super(
      lost
        ? 'The app reloaded before the promise settled, so its outcome is gone.'
        : `The promise had not settled after ${waitedMs}ms.`
    );
    this.name = 'CdpPromisePendingError';
  }
}

/** How often the app is asked whether the promise has settled. */
const PROMISE_POLL_INTERVAL_MS = 50;

export interface CdpClientOptions {
  /** Dev server (Metro) URL, without a trailing slash, e.g. `http://127.0.0.1:8081`. */
  metroUrl: string;
  targetSelector?: CdpTargetSelector;
  createWebSocket?: (url: string) => WebSocket;
  /**
   * How long to keep looking when no listed target can be talked to, in milliseconds.
   *
   * Zero — the default — reports the first answer. A command that runs straight after a reload
   * passes a few seconds instead, because the target the dev server lists during the reconnect
   * window is the runtime being replaced: it is listed, and a connection to it fails, so the
   * selector skips it and answers `null`. That is the `No target found.` friction run 4 recorded
   * as F39, and re-reading the list is what resolves it.
   */
  targetRetryMs?: number;
  /**
   * Talk only to an app on this platform.
   *
   * @ref ./targetPlatform — friction run 6's F51. Every reading command took the first target the
   * selector accepted, so a run told `--android` on a dev server that also had an iOS simulator
   * attached evaluated its expression, and earned its verdict, in the **simulator**. The list is
   * narrowed before the selector rather than inside it, so "which target answers the debugger" and
   * "which platform is this run about" stay two separate questions.
   */
  platform?: NavigatePlatform;
  /** What this machine's device tools reported, for {@link platform}. */
  deviceIndex?: DeviceNameIndex;
}

/** The failure for a platform-scoped client that found no target of its platform. */
export class NoTargetOnPlatformError extends Error {
  readonly isNoTargetOnPlatform = true;

  constructor(
    readonly platform: NavigatePlatform,
    readonly otherPlatforms: NavigatePlatform[],
    readonly undetermined: number
  ) {
    super(
      otherPlatforms.length > 0
        ? `No ${platform} app is connected to the dev server; the ${otherPlatforms.join(' and ')} app that is connected is a different runtime.`
        : `No app connected to the dev server could be shown to be running on ${platform}${undetermined > 0 ? `, and ${undetermined} could not be placed at all` : ''}.`
    );
    this.name = 'NoTargetOnPlatformError';
  }
}

/** How often the target list is re-read while {@link CdpClientOptions.targetRetryMs} runs. */
const TARGET_RETRY_POLL_MS = 250;

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

    // The default selector probes each target over its own connection, so it gets the same socket
    // factory as the client: a caller that injected one gets it honored everywhere.
    const selector =
      this.options.targetSelector ??
      createDefaultTargetSelector({ createWebSocket: this.options.createWebSocket });

    // Read once: what this machine has attached does not change while a reconnect runs, and asking
    // the device tools on every poll would be a subprocess every 250 ms.
    const index =
      this.options.platform == null
        ? null
        : (this.options.deviceIndex ??
          (await buildDeviceNameIndexIfNeededAsync(await this.listTargetsAsync())));

    // Re-read the list rather than re-run the selector over the same array: what changes during a
    // reconnect is which targets the dev server lists, not what this can make of a given one.
    const deadline = Date.now() + (this.options.targetRetryMs ?? 0);
    let target: CdpTarget | null = null;
    let scope: ScopedTargets | null = null;
    for (;;) {
      const listed = await this.listTargetsAsync();
      scope = index == null ? null : scopeTargets(listed, this.options.platform!, index);
      target = await selector(scope ? scope.matched : listed);
      if (target || Date.now() >= deadline) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, TARGET_RETRY_POLL_MS));
    }
    if (!target) {
      // Two different failures, and only one of them is "the app is not there". A scoped run that
      // found apps on the other platform has to say so, or the reader debugs a healthy app (F51).
      if (scope && scope.matched.length === 0) {
        throw new NoTargetOnPlatformError(
          this.options.platform!,
          [...new Set(scope.otherPlatform.map((entry) => entry.platform))],
          scope.undetermined.length
        );
      }
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
   * Open one debugger connection that several requests can share.
   *
   * Settling a promise takes more than one `Runtime.evaluate`, and a connection per request would
   * pay the handshake — and the inspector proxy's own bookkeeping — for each poll.
   */
  private async openSessionAsync(): Promise<CdpSession> {
    const ws = await this.createWebSocketAsync();
    const url = this.getWebSocketDebuggerUrl();
    const pending = new Map<
      number,
      { resolve: (result: unknown) => void; reject: (e: any) => void }
    >();
    let nextId = 1;
    let closedWith: Error | null = null;

    const failAll = (error: Error) => {
      closedWith ??= error;
      for (const [, handlers] of pending) {
        handlers.reject(error);
      }
      pending.clear();
    };

    const opened = new Promise<void>((resolve, reject) => {
      ws.on('open', () => resolve());
      ws.on('error', (error) => {
        debugEvent('cdp_socket_error', { url, error: error.message });
        failAll(error);
        reject(error);
      });
      ws.on('close', () => {
        const error = new Error(
          'The debugger connection closed before the app answered the request.'
        );
        failAll(error);
        reject(error);
      });
    });

    ws.on('message', (data) => {
      debugEvent('cdp_message', { url, message: data.toString() });
      let message: { id?: number; result?: unknown; error?: { message?: string; code?: number } };
      try {
        message = JSON.parse(data.toString());
      } catch (error) {
        failAll(error as Error);
        ws.close();
        return;
      }
      const handlers = message.id == null ? undefined : pending.get(message.id);
      if (!handlers) {
        return;
      }
      pending.delete(message.id!);
      if (message.error) {
        handlers.reject(
          new CdpRequestError(
            `The app rejected the evaluate request: ${message.error.message ?? 'unknown error'}`,
            message.error.code
          )
        );
        return;
      }
      handlers.resolve(message.result);
    });

    return {
      async sendAsync(method, params, timeoutMs) {
        if (closedWith) {
          throw closedWith;
        }
        // The open handshake counts against the caller's budget, so a dead socket does not wait
        // for a request that was never sent.
        await withDeadline(opened, timeoutMs, method);
        const id = nextId++;
        const answer = new Promise<unknown>((resolve, reject) => {
          pending.set(id, { resolve, reject });
        });
        ws.send(JSON.stringify({ id, method, params }));
        try {
          return await withDeadline(answer, timeoutMs, method);
        } finally {
          pending.delete(id);
        }
      },
      close() {
        closedWith ??= new Error('The debugger connection was closed.');
        pending.clear();
        ws.close();
      },
    };
  }

  /**
   * Evaluates a JavaScript expression in the connected runtime and resolves with its value,
   * or with the exception the expression threw.
   *
   * A promise the expression returns is settled inside the app and reported with its value — CDP's
   * own `awaitPromise` cannot do it on React Native's promise polyfill; see `./promiseSettling`.
   *
   * Rejects when the runtime cannot be reached, refuses the request, or does not answer in time,
   * and with {@link CdpPromisePendingError} when a returned promise outlives the wait.
   */
  async evaluateAsync(
    expression: string,
    options: CdpEvaluateOptions = {}
  ): Promise<CdpEvaluateResult> {
    const { awaitPromise = true, returnByValue = true, timeoutMs = 5000 } = options;
    const session = await this.openSessionAsync();
    try {
      return await evaluateOverSessionAsync(session, expression, {
        awaitPromise,
        returnByValue,
        timeoutMs,
      });
    } finally {
      session.close();
    }
  }
}

/** One debugger connection, with the request/response bookkeeping done. */
interface CdpSession {
  sendAsync(method: string, params: object, timeoutMs: number): Promise<unknown>;
  close(): void;
}

/** Reject a request the app never answered, naming the budget it was given. */
function withDeadline<T>(promise: Promise<T>, timeoutMs: number, method: string): Promise<T> {
  let handle: NodeJS.Timeout;
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      handle = setTimeout(
        () =>
          reject(
            new Error(
              `The app did not answer the ${method} request within ${timeoutMs}ms. The JavaScript thread may be blocked, or the expression may still be pending. Try a smaller expression or a longer timeout.`
            )
          ),
        timeoutMs
      );
    }),
  ]).finally(() => clearTimeout(handle));
}

/** Send one `Runtime.evaluate` and read the answer. */
async function runtimeEvaluateAsync(
  session: CdpSession,
  expression: string,
  { returnByValue, timeoutMs }: { returnByValue: boolean; timeoutMs: number }
): Promise<CdpEvaluateResult> {
  const result = await session.sendAsync(
    'Runtime.evaluate',
    {
      expression,
      // Sent for a runtime whose promises the inspector does tag, where it costs one round trip
      // less than the poll below. It is inert on React Native's polyfill, which is why the poll
      // exists at all.
      awaitPromise: true,
      returnByValue,
      includeCommandLineAPI: false,
      generatePreview: false,
    },
    timeoutMs
  );
  return parseEvaluateResponse(result as CdpMessageType.Runtime.EvaluateResponse);
}

/**
 * Evaluate an expression and, when it returns a thenable, wait for it inside the caller's budget.
 *
 * @throws {CdpPromisePendingError} when the wait ran out, or the app reloaded during it.
 */
async function evaluateOverSessionAsync(
  session: CdpSession,
  expression: string,
  {
    awaitPromise,
    returnByValue,
    timeoutMs,
  }: { awaitPromise: boolean; returnByValue: boolean; timeoutMs: number }
): Promise<CdpEvaluateResult> {
  const nonce = createPromiseNonce();
  const startedAt = Date.now();

  let result = await runtimeEvaluateAsync(
    session,
    wrapExpressionForPromises(expression, nonce, { subscribe: awaitPromise }),
    { returnByValue, timeoutMs }
  );

  // The wrapper puts the expression in an assignment, where a statement is a syntax error. Running
  // it as written is what this command did before the wrapper, and is the right answer either way:
  // a syntax error in the caller's own code is reported against the code they wrote.
  if (looksLikeWrapperSyntaxError(result.exceptionText)) {
    debugEvent('cdp_eval_unwrapped', { reason: result.exceptionText ?? '' });
    return await runtimeEvaluateAsync(session, expression, { returnByValue, timeoutMs });
  }

  if (!isPendingPromiseMarker(result.value, nonce)) {
    return result;
  }

  if (!awaitPromise) {
    return { type: 'promise', promise: { state: 'pending', awaited: false } };
  }

  // `--timeout` bounds the *wait*, and a poll is a global read that answers immediately, so the
  // two have separate budgets. Sharing one made the last poll of a run inherit whatever was left —
  // a millisecond, most of the time — and report "the app did not answer" for a healthy app whose
  // promise had simply not settled.
  const pollTimeoutMs = Math.max(250, Math.min(timeoutMs, 2000));
  const deadline = startedAt + timeoutMs;

  for (;;) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      await releasePromiseSlotAsync(session, nonce);
      throw new CdpPromisePendingError(Date.now() - startedAt);
    }

    await delayAsync(Math.min(PROMISE_POLL_INTERVAL_MS, remaining));
    if (Date.now() >= deadline) {
      await releasePromiseSlotAsync(session, nonce);
      throw new CdpPromisePendingError(Date.now() - startedAt);
    }

    result = await runtimeEvaluateAsync(session, buildPromisePollExpression(nonce), {
      returnByValue: true,
      timeoutMs: pollTimeoutMs,
    });
    const slot = parseSettledPromiseSlot(result.value);
    const waitedMs = Date.now() - startedAt;

    if (slot == null || slot.state === 'pending') {
      continue;
    }
    if (slot.state === 'missing') {
      throw new CdpPromisePendingError(waitedMs, true);
    }
    if (slot.state === 'rejected') {
      return { promise: { state: 'rejected', awaited: true, waitedMs, reason: slot.reason } };
    }
    return {
      value: slot.value,
      type: slot.type,
      description: slot.description,
      promise: { state: 'fulfilled', awaited: true, waitedMs },
    };
  }
}

/** Best effort: stop the app holding an outcome nobody is going to read. */
async function releasePromiseSlotAsync(session: CdpSession, nonce: string): Promise<void> {
  try {
    await session.sendAsync(
      'Runtime.evaluate',
      { expression: buildPromiseReleaseExpression(nonce), returnByValue: true },
      1000
    );
  } catch (error: unknown) {
    debugEvent('cdp_promise_release_failed', {
      reason: error instanceof Error ? error.message : String(error),
    });
  }
}

function delayAsync(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
 * runtime command report "No target found" there, including `runtime:errors`, which never
 * evaluates anything. Such a target is kept as a fallback instead: it is used when no
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
