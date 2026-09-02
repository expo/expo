// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
// The dev server's client command channel: the socket the interactive `r` keypress reloads apps
// through, spoken from outside the CLI process.
//
// This is a process-boundary client, exactly like `cdpClient.ts` (llp/0001 §Constraints item 5):
// it speaks the dev server's own WebSocket protocol and imports nothing from `@expo/cli`.
//
// The endpoint is `/message` [observed —
// `packages/@expo/cli/src/start/server/metro/dev-server/createMetroMiddleware.ts`,
// `createMessageSocket.ts`]. A message with a `method` and neither an `id` nor a `target` is a
// *broadcast*: the dev server relays it verbatim to every other connected client, which is how a
// reload reaches the app. It does so only for a trusted client — a socket from the loopback
// interface whose `Origin`, if it sends one, is the dev server's own — and only for the two
// methods it allows a client to broadcast, `reload` and `devMenu`.
//
// The detail that decides whether any of this works: **every message carries `version: 2`**
// [observed — `dev-server/utils/socketMessages.ts` `parseRawMessage`]. A message without it, or
// with another number, is dropped with no answer and no error. Live proof [observed — 2026-08-23,
// SDK 57 app in Expo Go on an iOS simulator]: `{"method":"reload"}` left a global planted in the
// app untouched, and `{"version":2,"method":"reload"}` cleared it.

import { WebSocket } from 'ws';

import { normalizeDevServerUrl } from './devServer';

/** Protocol version the dev server's message socket requires on every frame. */
export const MESSAGE_SOCKET_PROTOCOL_VERSION = 2;

/** Path the dev server mounts the client command socket on. */
export const MESSAGE_SOCKET_ENDPOINT = '/message';

/**
 * The clients connected to the message socket, as `socket id -> upgrade query`.
 *
 * The id comes from a counter the dev server never rewinds and never reuses
 * [observed — `dev-server/utils/createSocketMap.ts`], so two reads that name different ids
 * describe two different connections. That is what makes {@link peersChanged} evidence rather
 * than a guess.
 *
 * The value is the query string of the client's upgrade request, e.g. `role=ios` for the app, and
 * null for a client that sent none.
 */
export type MessageSocketPeers = Record<string, string | null>;

/** Turn a dev server origin into the `ws://` URL of its message socket. */
export function resolveMessageSocketUrl(devServerUrl: string): string {
  const url = new URL(normalizeDevServerUrl(devServerUrl));
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${url.host}${MESSAGE_SOCKET_ENDPOINT}`;
}

/**
 * Whether the set of connected clients changed between two reads.
 *
 * Null when either read failed, because a comparison that was never made is not evidence of
 * anything — the same rule `dev:wait`'s bundle check follows for `unknown` (llp/0010 §An empty target list is inconclusive
 * to ask about the _project_).
 */
export function peersChanged(
  before: MessageSocketPeers | null,
  after: MessageSocketPeers | null
): boolean | null {
  if (before == null || after == null) {
    return null;
  }
  const beforeIds = Object.keys(before).sort();
  const afterIds = Object.keys(after).sort();
  return beforeIds.length !== afterIds.length || beforeIds.some((id, i) => id !== afterIds[i]);
}

/** Whether a `getpeers` result is the map the protocol describes. */
function isPeerMap(value: unknown): value is MessageSocketPeers {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export interface ConnectMessageSocketOptions {
  /** How long the handshake may take, in milliseconds. */
  timeoutMs?: number;
  /** Socket factory, so the client is testable without a dev server. */
  createWebSocket?: (url: string) => WebSocket;
}

export interface GetPeersOptions {
  /** How long to wait for the dev server's reply, in milliseconds. */
  timeoutMs?: number;
}

/**
 * A connection to the dev server's client command socket.
 *
 * Deliberately thin: it sends two kinds of frame and reads one. Everything that decides what a
 * reload *means* lives in `src/reload/`.
 */
export class DevServerMessageSocket {
  private nextRequestId = 0;
  private readonly pending = new Map<string, (result: MessageSocketPeers | null) => void>();

  constructor(private readonly socket: WebSocket) {
    this.socket.on('message', (data: unknown) => this.receive(String(data)));
  }

  /**
   * Ask the dev server which other clients are connected.
   *
   * This is also the protocol handshake. The dev server answers a request it understands and
   * silently drops one it does not, so a reply proves it speaks
   * {@link MESSAGE_SOCKET_PROTOCOL_VERSION} — and therefore that a broadcast sent on the same
   * socket will be relayed rather than discarded.
   *
   * @returns the peers, or null when the dev server did not answer in time.
   */
  async getPeersAsync({
    timeoutMs = 2000,
  }: GetPeersOptions = {}): Promise<MessageSocketPeers | null> {
    const id = `@expo/agent-cli#${this.nextRequestId++}`;
    return await new Promise<MessageSocketPeers | null>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        resolve(null);
      }, timeoutMs);
      timer.unref?.();
      this.pending.set(id, (result) => {
        clearTimeout(timer);
        resolve(result);
      });
      this.send({ target: 'server', method: 'getpeers', id });
    });
  }

  /**
   * Broadcast a reload to every client the dev server has.
   *
   * Fire and forget by construction: a broadcast has no id, so the protocol has no reply to give.
   * What the reload *did* is established afterwards, by reading the peers again.
   */
  broadcastReload(): void {
    this.send({ method: 'reload' });
  }

  close(): void {
    for (const [id, resolve] of this.pending) {
      this.pending.delete(id);
      resolve(null);
    }
    try {
      this.socket.close();
    } catch {
      // Closing a socket that is already gone is not a failure of the command that closed it.
    }
  }

  private send(message: Record<string, unknown>): void {
    this.socket.send(JSON.stringify({ version: MESSAGE_SOCKET_PROTOCOL_VERSION, ...message }));
  }

  private receive(raw: string): void {
    let message: { id?: unknown; result?: unknown; version?: unknown };
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    // A reply stamped with another version is a dev server this client cannot read, which is the
    // same outcome as no reply at all: the pending request is left to time out.
    if (message.version !== MESSAGE_SOCKET_PROTOCOL_VERSION) {
      return;
    }
    if (typeof message.id !== 'string') {
      return;
    }
    const resolve = this.pending.get(message.id);
    if (!resolve) {
      return;
    }
    this.pending.delete(message.id);
    resolve(isPeerMap(message.result) ? message.result : null);
  }
}

/**
 * Open a connection to a dev server's message socket.
 *
 * No `Origin` header is sent. The dev server trusts a loopback client that sends none
 * [observed — `packages/@expo/cli/src/utils/net.ts` `isMatchingOrigin`], and sending one would
 * have to guess the host spelling the dev server built its own base URL from — `localhost` and
 * `127.0.0.1` are different hosts to that check, so a guess that is wrong is worse than silence.
 * This is the opposite of `createInspectorWebSocket`, whose endpoint rejects a handshake *without*
 * an `Origin`; the two endpoints really do differ.
 *
 * @throws {Error} when the socket cannot be opened. The caller decides what an unreachable
 * message socket means for it.
 */
export async function connectMessageSocketAsync(
  devServerUrl: string,
  { timeoutMs = 5000, createWebSocket }: ConnectMessageSocketOptions = {}
): Promise<DevServerMessageSocket> {
  const url = resolveMessageSocketUrl(devServerUrl);
  const socket = createWebSocket ? createWebSocket(url) : new WebSocket(url);

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      try {
        socket.close();
      } catch {}
      reject(new Error(`the message socket at ${url} did not open within ${timeoutMs}ms`));
    }, timeoutMs);
    timer.unref?.();

    const onOpen = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    function cleanup() {
      clearTimeout(timer);
      socket.off('open', onOpen);
      socket.off('error', onError);
    }
    socket.on('open', onOpen);
    socket.on('error', onError);
  });

  // Past the handshake an error is a dropped connection, not a failed connect: a pending read
  // times out on its own, and nothing else is in flight. Left unhandled it would be an unhandled
  // `error` event, which ends the process.
  socket.on('error', () => {});

  return new DevServerMessageSocket(socket);
}
