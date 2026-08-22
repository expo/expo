// @ref llp/0005-runtime-loop-tools.rfc.md §Candidates — "Network inspection".
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

import { CdpClient, type CdpClientOptions, type CdpTarget } from './cdpClient';
import { debugEvent } from './events';

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

  constructor(public readonly reason: string) {
    super(`The app refused Network.enable: ${reason}`);
    this.name = 'NetworkDomainUnavailableError';
  }
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: any;
  result?: unknown;
  error?: { message?: string };
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

    const client = new CdpClient({ metroUrl, targetSelector, createWebSocket });
    const ws: WebSocket = await client.createWebSocketAsync();
    this.clientWebSocketDebuggerUrl = client.getWebSocketDebuggerUrl();

    // Insertion-ordered, so the records come back in the order the app sent the requests.
    const records = new Map<string, NetworkRequestRecord>();
    let requestId = 0;
    let enableRequestId = 0;

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

          // The only reply this collector reads is the one to `Network.enable`: an error there
          // means the domain is missing, which is the difference between "no traffic" and
          // "cannot report traffic".
          if (message.id === enableRequestId && message.error) {
            settle(() => {
              reject(new NetworkDomainUnavailableError(message.error?.message ?? 'unknown error'));
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
