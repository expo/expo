import WebSocket from 'ws';

import { event } from '../../inspectorEvents';
import type { ConsoleApiCall, ConsoleEntry, ConsoleTarget } from './types';

interface ConsoleSessionOptions {
  target: ConsoleTarget;
  serverBaseUrl: string;
  // Entries at or before this timestamp were delivered by an earlier session with the same app.
  seenUntil?: number;
  onEntry(entry: ConsoleEntry): void;
  onOpen(): void;
  onClose(): void;
}

export interface ConsoleSession {
  readonly target: ConsoleTarget;
  readonly seenUntil: number;
  send<T = unknown>(method: string, params?: object): Promise<T>;
  // Safe to repeat: an app that already reports console calls to this session replays nothing.
  enable(): void;
  close(): void;
}

const HOST_NOTICE_CONTEXT_SUFFIX = '#InstanceAgent';

/**
 * Opens a CDP session with an app and reports each console call it makes.
 *
 * The session enables only the `Runtime` domain. React Native treats a session with both `Runtime`
 * and `Log` enabled as an attached debugger, which hides LogBox warnings in the app.
 */
export function openConsoleSession({
  target,
  serverBaseUrl,
  seenUntil = 0,
  onEntry,
  onOpen,
  onClose,
}: ConsoleSessionOptions): ConsoleSession {
  const socket = new WebSocket(target.webSocketDebuggerUrl, {
    headers: { Origin: serverBaseUrl },
  });
  const pendingRequests = new Map<
    number,
    { resolve(result: any): void; reject(error: Error): void }
  >();
  let lastRequestId = 0;

  const session: ConsoleSession & { seenUntil: number } = {
    target,
    seenUntil,
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        if (socket.readyState !== WebSocket.OPEN) {
          reject(new Error(`The console session with ${target.title} is closed.`));
          return;
        }
        const id = ++lastRequestId;
        pendingRequests.set(id, { resolve, reject });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    enable() {
      session.send('Runtime.enable').catch(() => {});
    },
    close() {
      socket.close();
    },
  };

  socket.on('open', () => {
    session.enable();
    onOpen();
  });

  socket.on('message', (data) => {
    let message: CdpMessage;
    try {
      message = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (message.id != null) {
      const request = pendingRequests.get(message.id);
      pendingRequests.delete(message.id);
      if (message.error) {
        request?.reject(new Error(message.error.message));
      } else {
        request?.resolve(message.result);
      }
      return;
    }

    if (message.method !== 'Runtime.consoleAPICalled' || !message.params) {
      return;
    }
    const call = message.params;
    if (call.context?.endsWith(HOST_NOTICE_CONTEXT_SUFFIX) || call.timestamp <= session.seenUntil) {
      return;
    }
    session.seenUntil = call.timestamp;
    onEntry({
      target,
      session,
      type: call.type,
      timestamp: call.timestamp,
      args: call.args,
      callFrames: call.stackTrace?.callFrames ?? [],
    });
  });

  socket.on('error', (error) => {
    event('console_session_failed', { title: target.title, error: event.error(error) });
  });

  socket.on('close', () => {
    for (const request of pendingRequests.values()) {
      request.reject(new Error(`The console session with ${target.title} closed.`));
    }
    pendingRequests.clear();
    onClose();
  });

  return session;
}

interface CdpMessage {
  id?: number;
  result?: unknown;
  error?: { message: string };
  method?: string;
  params?: ConsoleApiCall;
}
