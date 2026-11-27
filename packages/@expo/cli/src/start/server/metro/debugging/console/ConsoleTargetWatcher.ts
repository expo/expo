import type { IncomingMessage } from 'node:http';
import type { RawData, WebSocket, WebSocketServer } from 'ws';

import { event } from '../../inspectorEvents';
import { openConsoleSession } from './ConsoleSession';
import type { ConsoleSession } from './ConsoleSession';
import type { ConsoleEntry, ConsoleTarget } from './types';

interface ConsoleTargetWatcherOptions {
  serverBaseUrl: string;
  deviceSocketServer: WebSocketServer;
  onEntry(entry: ConsoleEntry): void;
  enableIntervalMs?: number;
}

export interface ConsoleTargetWatcher {
  readonly targets: ReadonlyMap<string, ConsoleTarget>;
  close(): void;
}

interface DevicePage {
  id: string;
  title: string;
  app: string;
}

const DEBUGGER_ENDPOINT = '/inspector/debug';
// A device socket carries all CDP traffic, so only messages with this text are parsed.
const PAGE_LIST_MARKER = '"event":"getPages"';

/**
 * Keeps one console session open with each app connected to the dev server.
 *
 * Apps are read from the page list each device sends the inspector proxy, about once a second.
 * Requesting `/json/list` instead makes the proxy warn about each device that has no page yet.
 *
 * Each session is enabled again when its device reconnects, and at an interval. The inspector proxy
 * moves an open session to a device that reconnects under the same ID, where nothing is enabled.
 */
export function watchConsoleTargets({
  serverBaseUrl,
  deviceSocketServer,
  onEntry,
  enableIntervalMs = 5000,
}: ConsoleTargetWatcherOptions): ConsoleTargetWatcher {
  const sessions = new Map<string, ConsoleSession>();
  const targets = new Map<string, ConsoleTarget>();
  const seenUntilByDevice = new Map<string, number>();
  const startedAt = Date.now();
  let enabledAt = startedAt;
  let isClosed = false;

  function syncSessions(deviceId: string, deviceTargets: ConsoleTarget[]) {
    const targetIds = new Set(deviceTargets.map((target) => target.id));
    for (const [id, session] of sessions) {
      if (session.target.logicalDeviceId === deviceId && !targetIds.has(id)) {
        session.close();
      }
    }
    for (const target of deviceTargets) {
      if (!sessions.has(target.id)) {
        openSession(target);
      }
    }
  }

  function openSession(target: ConsoleTarget) {
    const session = openConsoleSession({
      target,
      serverBaseUrl,
      seenUntil: seenUntilByDevice.get(target.logicalDeviceId) ?? startedAt,
      onEntry,
      onClose() {
        seenUntilByDevice.set(target.logicalDeviceId, session.seenUntil);
        if (sessions.get(target.id) === session) {
          sessions.delete(target.id);
          targets.delete(target.id);
        }
      },
    });
    sessions.set(target.id, session);
    targets.set(target.id, target);
  }

  function onDeviceMessage(deviceId: string, deviceName: string, data: RawData) {
    const pages = isClosed ? undefined : parsePageList(data);
    if (!pages) {
      return;
    }
    syncSessions(
      deviceId,
      pages.map((page) => toConsoleTarget(page, deviceId, deviceName, serverBaseUrl))
    );
    if (Date.now() - enabledAt >= enableIntervalMs) {
      enabledAt = Date.now();
      sessions.forEach((session) => session.enable());
    }
  }

  function onDeviceConnection(socket: WebSocket, request: IncomingMessage) {
    const query = new URL(request.url ?? '', serverBaseUrl).searchParams;
    const deviceId = query.get('device');
    if (deviceId == null) {
      return;
    }
    const deviceName = query.get('name') ?? 'Unknown';
    const deviceSessions = [...sessions.values()].filter(
      (session) => session.target.logicalDeviceId === deviceId
    );
    if (deviceSessions.length) {
      event('console_device_reconnected', { device: deviceName, sessions: deviceSessions.length });
      deviceSessions.forEach((session) => session.enable());
    }
    socket.on('message', (data) => onDeviceMessage(deviceId, deviceName, data));
  }

  deviceSocketServer.on('connection', onDeviceConnection);

  return {
    targets,
    close() {
      isClosed = true;
      deviceSocketServer.off('connection', onDeviceConnection);
      for (const session of sessions.values()) {
        session.close();
      }
    },
  };
}

function parsePageList(data: RawData): DevicePage[] | undefined {
  const text = data.toString();
  if (!text.includes(PAGE_LIST_MARKER)) {
    return undefined;
  }
  try {
    const message: { event?: string; payload?: DevicePage[] } = JSON.parse(text);
    return message.event === 'getPages' && Array.isArray(message.payload)
      ? message.payload
      : undefined;
  } catch {
    return undefined;
  }
}

function toConsoleTarget(
  page: DevicePage,
  deviceId: string,
  deviceName: string,
  serverBaseUrl: string
): ConsoleTarget {
  const debuggerUrl = new URL(DEBUGGER_ENDPOINT, serverBaseUrl);
  debuggerUrl.protocol = debuggerUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  debuggerUrl.searchParams.set('device', deviceId);
  debuggerUrl.searchParams.set('page', page.id);
  return {
    id: `${deviceId}-${page.id}`,
    title: page.title,
    appId: page.app,
    deviceName,
    logicalDeviceId: deviceId,
    webSocketDebuggerUrl: debuggerUrl.href,
  };
}
