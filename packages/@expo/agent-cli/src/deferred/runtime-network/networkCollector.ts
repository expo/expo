// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// @ref llp/0017-deferred-commands.reference.md §runtime:network
// Collects the HTTP requests the app makes over the debugger protocol during a time window, so a
// failing API call is readable instead of guessed at.
//
// IMPORTANT caveat — the CDP Network domain is not guaranteed to exist in a React Native runtime.
// It is behind an unstable flag in Fusebox: the debugger target the dev server lists carries
// `unstable_enableNetworkPanel=true` in its `devtoolsFrontendUrl` [observed on a live SDK 57
// target, 2026-08-22], and a runtime built without network inspection answers `Network.enable`
// with a JSON-RPC error instead of a result. That answer is reported as
// `NetworkDomainUnavailableError`, never as an empty window: "the app made no requests" and "this
// runtime cannot report requests" are different facts, and an agent that confuses them stops
// debugging the wrong thing.
//
// Two more things live use showed [observed — SDK 57 / RN 0.86.2 in Expo Go, 2026-08-22]:
//
//   - A request that cannot connect at all (`fetch` to a closed port) sends
//     `Network.requestWillBeSent` and then nothing. React Native rejects the JavaScript promise but
//     sends no `Network.loadingFailed`, so the record stays without a status. That is why a record
//     with neither a status nor a failure is reported as its own outcome instead of being folded
//     into "failed": the network log alone cannot say which one it was.
//   - A successful `Network.enable` is an acknowledgement, not a promise of events. Expo Go for
//     Android answers `Network.enable` and `Runtime.enable` with a result and then sends nothing,
//     because its Hermes build has no Chrome DevTools Protocol debugger at all — the runtime says
//     so itself over `Log.entryAdded` ("The current JavaScript engine, HermesRuntime[RNBridgeless],
//     does not support debugging over the Chrome DevTools Protocol"). Only React Native's own agent
//     answers there, so the acks arrive but no app data does. That runtime is recognized by its
//     `-32601` answer to `Runtime.evaluate`; see `RUNTIME_EVALUATE_UNSUPPORTED` in `runtimeAsync`.
import type CdpMessageType from 'devtools-protocol';
import { type WebSocket } from 'ws';

import {
  CdpClient,
  RPC_METHOD_NOT_FOUND,
  type CdpClientOptions,
  type CdpTarget,
} from '../../runtime/cdpClient';
import { debugEvent } from '../../runtime/events';
import {
  readNoCdpAnnouncement,
  type RuntimeDebuggerCapability,
} from '../../runtime/runtimeErrorCollector';

/** A single HTTP request the running app made, with the answer it got. */
export interface NetworkRequestRecord {
  /** Request id the runtime assigned, which correlates the request with its response. */
  requestId: string;

  /** HTTP method, e.g. `GET`. */
  method: string;

  /** Request URL, as the app asked for it. */
  url: string;

  /** Epoch timestamp in milliseconds of when the request was sent. */
  timestamp: number;

  /** HTTP status, or null while no response arrived (the request failed or is still pending). */
  status: number | null;

  /** HTTP status text the server sent, when it sent one. */
  statusText: string | null;

  /** Content type of the response, when a response arrived. */
  mimeType: string | null;

  /** Why the request failed, when the runtime reported a failure. Null otherwise. */
  failure: string | null;
}

export interface CdpNetworkCollectorConfig extends CdpClientOptions {
  /** How long to listen for requests before resolving, in milliseconds (default: 5000). */
  durationMs?: number;

  /** How long to wait for the debugger connection to open, in milliseconds (default: 2000). */
  timeoutMs?: number;
}

/**
 * Thrown when the connected runtime refuses `Network.enable`, i.e. it does not implement the CDP
 * Network domain. Carried as its own type so the command can tell the caller what to do instead
 * of reporting a window with nothing in it.
 */
export class NetworkDomainUnavailableError extends Error {
  readonly isNetworkDomainUnavailable = true;

  /**
   * @param reason the runtime's own answer, quoted verbatim into the command's diagnosis: the two
   * refusals React Native ships have different causes and opposite recoveries, and only this
   * string tells them apart.
   * @param rpcCode the JSON-RPC code of that answer, when the runtime sent one. `-32601` means the
   * runtime carries no handler for the method at all; an internal error means it has one and
   * declined.
   */
  constructor(
    public readonly reason: string,
    public readonly rpcCode?: number
  ) {
    super(`The app refused Network.enable: ${reason}`);
    this.name = 'NetworkDomainUnavailableError';
  }
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: any;
  result?: unknown;
  error?: { message?: string; code?: number };
}

/**
 * Collects the app's network activity over a time window, over the debugger protocol.
 *
 * Shaped like {@link import('./runtimeErrorCollector').CdpRuntimeErrorCollector}, but the records
 * are stateful: a request and its response arrive as two events and are correlated by request id.
 */
export class CdpNetworkCollector {
  public readonly name = 'cdp-network';
  private clientWebSocketDebuggerUrl?: string;

  /**
   * What the runtime said about its own debugger, filled in by {@link collectAsync}.
   *
   * The field this collector needs most, and the one it did not have. `Network.enable` **succeeds**
   * on Expo Go for Android and then nothing arrives [observed — 2026-08-25, live: `{"result":{},
   * "id":3}` and no `Network.requestWillBeSent` ever], so the empty list this resolved with looked
   * exactly like an app that made no requests (F61). See
   * {@link import('./runtimeErrorCollector').RuntimeDebuggerCapability}.
   */
  public capability: RuntimeDebuggerCapability = { blind: null, evidence: null };

  constructor(private readonly config: CdpNetworkCollectorConfig) {}

  get metadata(): Record<string, unknown> {
    return {
      metroUrl: this.config.metroUrl,
      webSocketDebuggerUrl: this.clientWebSocketDebuggerUrl ?? '',
    };
  }

  /**
   * Listens for network activity for `durationMs` and resolves with the requests seen in that
   * window, in the order the app sent them.
   *
   * @throws {NetworkDomainUnavailableError} when the runtime does not implement the Network domain.
   * @throws {Error} when the app cannot be reached, so callers can tell "no requests" from
   * "not connected".
   */
  async collectAsync(): Promise<NetworkRequestRecord[]> {
    const {
      metroUrl,
      targetSelector,
      createWebSocket,
      durationMs = 5000,
      timeoutMs = 2000,
    } = this.config;

    const client = new CdpClient({
      metroUrl,
      targetSelector,
      createWebSocket,
      platform: this.config.platform,
      deviceIndex: this.config.deviceIndex,
    });
    const ws: WebSocket = await client.createWebSocketAsync();
    this.clientWebSocketDebuggerUrl = client.getWebSocketDebuggerUrl();

    // Insertion-ordered, so the records come back in the order the app sent the requests.
    const records = new Map<string, NetworkRequestRecord>();
    let requestId = 0;
    let enableRequestId = 0;
    let capabilityRequestId = 0;
    this.capability = { blind: null, evidence: null };
    const sawEvidence = (blind: boolean, evidence: string) => {
      if (this.capability.blind == null || (blind && !this.capability.blind)) {
        this.capability = { blind, evidence };
      }
    };

    return new Promise<NetworkRequestRecord[]>((resolve, reject) => {
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

        enableRequestId = ++requestId;
        ws.send(JSON.stringify({ id: enableRequestId, method: 'Network.enable' }));
        // The same capability probe the error collector runs, for the same reason: an
        // acknowledgement is not a promise of events, and only these two answers tell an app that
        // made no requests from a runtime that cannot report them (F61).
        ws.send(JSON.stringify({ id: ++requestId, method: 'Log.enable' }));
        capabilityRequestId = ++requestId;
        ws.send(
          JSON.stringify({
            id: capabilityRequestId,
            method: 'Runtime.evaluate',
            params: { expression: '1', returnByValue: true },
          })
        );

        collectionHandle = setTimeout(() => {
          settle(() => {
            ws.send(JSON.stringify({ id: ++requestId, method: 'Network.disable' }));
            // Give a brief moment for the disable command to send before closing.
            setTimeout(() => {
              ws.close();
              resolve([...records.values()]);
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
        settle(() => resolve([...records.values()]));
      });

      ws.on('message', (data) => {
        try {
          const message: CdpMessage = JSON.parse(data.toString());

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

          // The only reply this collector reads is the one to `Network.enable`: an error there
          // means the domain is missing, which is the difference between "no traffic" and
          // "cannot report traffic".
          if (message.id === enableRequestId && message.error) {
            settle(() => {
              reject(
                new NetworkDomainUnavailableError(
                  message.error?.message ?? 'unknown error',
                  message.error?.code
                )
              );
              ws.close();
            });
            return;
          }

          applyNetworkEvent(records, parseNetworkMessage(message));
        } catch (error) {
          debugEvent('cdp_parse_failed', {
            reason: error instanceof Error ? error.message : String(error),
          });
        }
      });
    });
  }
}

/** One network fact the runtime reported, in the shape the record store applies. */
export type NetworkEvent =
  | { kind: 'request'; requestId: string; method: string; url: string; timestamp: number }
  | {
      kind: 'response';
      requestId: string;
      status: number;
      statusText: string | null;
      mimeType: string | null;
    }
  | { kind: 'failure'; requestId: string; failure: string; canceled: boolean };

/**
 * Turns a CDP event into a network fact, or returns null when the event says nothing about a
 * request this collector reports.
 */
export function parseNetworkMessage(message: CdpMessage): NetworkEvent | null {
  const params = message.params ?? {};
  const requestId: string | undefined = params.requestId;
  if (!requestId) {
    return null;
  }

  if (message.method === 'Network.requestWillBeSent') {
    const event = params as CdpMessageType.Network.RequestWillBeSentEvent;
    return {
      kind: 'request',
      requestId,
      method: event.request?.method || 'GET',
      url: event.request?.url ?? '',
      // `wallTime` is seconds since the epoch; `timestamp` is a monotonic clock with no epoch,
      // so it cannot be turned into a date. Only `requestWillBeSent` carries `wallTime`.
      timestamp:
        typeof event.wallTime === 'number' ? Math.round(event.wallTime * 1000) : Date.now(),
    };
  }

  if (message.method === 'Network.responseReceived') {
    const event = params as CdpMessageType.Network.ResponseReceivedEvent;
    return {
      kind: 'response',
      requestId,
      status: event.response?.status ?? 0,
      statusText: event.response?.statusText || null,
      mimeType: event.response?.mimeType || null,
    };
  }

  if (message.method === 'Network.loadingFailed') {
    const event = params as CdpMessageType.Network.LoadingFailedEvent;
    const canceled = event.canceled === true;
    return {
      kind: 'failure',
      requestId,
      // A canceled request carries no `errorText`, and "unknown error" would read as a bug in the
      // app rather than as the app dropping a request it no longer needs.
      failure: event.errorText || (canceled ? 'The request was canceled.' : 'Unknown error'),
      canceled,
    };
  }

  return null;
}

/**
 * Folds a network fact into the records collected so far.
 *
 * A response or a failure for a request that was never seen is dropped: it belongs to a request
 * the app sent before this window opened, so its method and URL are unknown.
 */
function applyNetworkEvent(
  records: Map<string, NetworkRequestRecord>,
  event: NetworkEvent | null
): void {
  if (!event) {
    return;
  }

  if (event.kind === 'request') {
    records.set(event.requestId, {
      requestId: event.requestId,
      method: event.method,
      url: event.url,
      timestamp: event.timestamp,
      status: null,
      statusText: null,
      mimeType: null,
      failure: null,
    });
    return;
  }

  const record = records.get(event.requestId);
  if (!record) {
    return;
  }

  if (event.kind === 'response') {
    record.status = event.status;
    record.statusText = event.statusText;
    record.mimeType = event.mimeType;
    return;
  }

  record.failure = event.failure;
}

/**
 * Whether the dev server offers this target the (unstable) Fusebox network panel.
 *
 * Read from the target's `devtoolsFrontendUrl` query string, which is where the dev server records
 * the flag [observed, 2026-08-22]. Used only to explain a missing Network domain: the flag
 * describes what the debugger frontend would show, not a promise from the runtime.
 */
export function targetAdvertisesNetworkPanel(
  target: Pick<CdpTarget, 'devtoolsFrontendUrl'>
): boolean {
  return /[?&]unstable_enableNetworkPanel=true\b/.test(target.devtoolsFrontendUrl ?? '');
}

/**
 * Why the runtime refused `Network.enable`.
 *
 * React Native has exactly two refusals, and they need opposite next steps
 * [observed — `ReactCommon/jsinspector-modern/HostAgent.cpp`, React Native 0.86]:
 *
 * ```cpp
 * if (InspectorFlags::getInstance().getNetworkInspectionEnabled()) {
 *   if (req.method == "Network.enable") {
 *     if (inspector.getSystemState().registeredHostsCount > 1) {
 *       frontendChannel_(cdp::jsonError(req.id, cdp::ErrorCode::InternalError,
 *         "The Network domain is unavailable when multiple React Native hosts are registered."));
 * ```
 *
 * With the flag off the method is never handled at all, and the dispatcher answers `-32601`.
 * The first refusal is about the state of the app process and clears on a relaunch; the second is
 * about how the runtime was built and never clears. Reporting either as the other sends a caller
 * to upgrade an SDK that would not have helped, which is exactly what this command used to do.
 */
export type NetworkDomainRefusal =
  /** More than one React Native host is registered in the app process. */
  | 'multiple-hosts'
  /** The runtime carries no handler for the method. */
  | 'not-implemented'
  /**
   * The domain was **acknowledged** and the runtime has no debugger behind it.
   *
   * The third case, and the one that was missing [observed — 2026-08-25, Expo Go on an Android
   * emulator: `Network.enable` answered `{"result":{}}` and no network event ever followed, while
   * `Runtime.evaluate` answered `-32601` and `Log.entryAdded` said the engine "does not support
   * debugging over the Chrome DevTools Protocol"]. Nothing refused anything, so the old
   * classification never ran at all and `runtime:network` printed an empty list with exit 0 for an
   * app that was making requests (F61).
   */
  | 'acknowledged-but-blind'
  /** Nothing refused the domain, and the runtime does answer the debugger. */
  | 'none'
  /** The runtime refused for a reason this CLI has not seen. */
  | 'unknown';

/** The message React Native sends when more than one host is registered [observed — RN 0.86]. */
const MULTIPLE_HOSTS_MESSAGE = 'multiple React Native hosts are registered';

/**
 * Classify what happened to `Network.enable` by what the runtime actually answered.
 *
 * @param error the refusal, or **null** when the call was acknowledged. Null is a real input rather
 * than a missing one: an acknowledgement followed by silence is its own outcome, and treating it as
 * "no refusal, therefore fine" is what let an empty request list stand for a runtime that cannot
 * report requests at all.
 * @param context.debuggerBlind what the runtime said about carrying a debugger at all
 * ({@link CdpNetworkCollector.capability}).
 */
export function classifyNetworkDomainRefusal(
  error: Pick<NetworkDomainUnavailableError, 'reason' | 'rpcCode'> | null,
  context: { debuggerBlind?: boolean | null } = {}
): NetworkDomainRefusal {
  if (error == null) {
    return context.debuggerBlind === true ? 'acknowledged-but-blind' : 'none';
  }
  if (error.reason.includes(MULTIPLE_HOSTS_MESSAGE)) {
    return 'multiple-hosts';
  }
  // The code is the reliable half; the wording of a missing handler differs per runtime, so the
  // text is only consulted when no code came back.
  if (
    error.rpcCode === RPC_METHOD_NOT_FOUND ||
    /\bwasn't found\b|\bnot found\b/i.test(error.reason)
  ) {
    return 'not-implemented';
  }
  return 'unknown';
}
