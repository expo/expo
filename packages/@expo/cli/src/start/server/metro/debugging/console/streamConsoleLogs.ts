import type { WebSocketServer } from 'ws';

import { watchConsoleTargets } from './ConsoleTargetWatcher';
import type { ConsoleTargetWatcher } from './ConsoleTargetWatcher';
import { resolveConsoleArgsAsync } from './resolveConsoleArgs';
import type { CallFrame, ConsoleApiType, ConsoleEntry } from './types';

export type DeviceConsoleLevel =
  | 'trace'
  | 'info'
  | 'error'
  | 'warn'
  | 'log'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'debug';

interface DeviceConsoleReporter {
  logDeviceConsole(log: { level: DeviceConsoleLevel; data: string[]; device?: string }): void;
  update(event: { type: 'unstable_server_log'; level: 'warn'; data: string[] }): void;
}

interface StreamConsoleLogsOptions {
  serverBaseUrl: string;
  deviceSocketServer: WebSocketServer;
  reporter: DeviceConsoleReporter;
  sessionGraceMs?: number;
}

const LEVEL_BY_TYPE: Partial<Record<ConsoleApiType, DeviceConsoleLevel>> = {
  log: 'log',
  debug: 'debug',
  info: 'info',
  error: 'error',
  assert: 'error',
  warning: 'warn',
  dir: 'log',
  dirxml: 'log',
  table: 'log',
  trace: 'trace',
  startGroup: 'group',
  startGroupCollapsed: 'groupCollapsed',
  endGroup: 'groupEnd',
};

/**
 * Prints the console output of each connected app through the terminal reporter.
 *
 * A device that connects to the inspector proxy and has no console session after `sessionGraceMs`
 * gets one warning, since nothing else reports its logs.
 */
export function streamConsoleLogs({
  serverBaseUrl,
  deviceSocketServer,
  reporter,
  sessionGraceMs = 3000,
}: StreamConsoleLogsOptions): ConsoleTargetWatcher {
  let printed = Promise.resolve();
  let graceTimer: ReturnType<typeof setTimeout> | undefined;
  const warnedDeviceIds = new Set<string>();

  function warnAboutDevicesWithoutSession() {
    clearTimeout(graceTimer);
    const attachedDeviceIds = new Set(
      [...watcher.targets.values()].map((target) => target.logicalDeviceId)
    );
    const deadlines: number[] = [];
    for (const [deviceId, device] of watcher.devices) {
      if (attachedDeviceIds.has(deviceId) || warnedDeviceIds.has(deviceId)) {
        continue;
      }
      const deadline = device.connectedAt + sessionGraceMs;
      if (Date.now() < deadline) {
        deadlines.push(deadline);
        continue;
      }
      warnedDeviceIds.add(deviceId);
      reporter.update({
        type: 'unstable_server_log',
        level: 'warn',
        data: [
          `No CDP console session opened with ${device.name} within ${sessionGraceMs / 1000} seconds. ` +
            'Its logs are not printed here. Open React Native DevTools to read them.',
        ],
      });
    }
    if (deadlines.length) {
      graceTimer = setTimeout(warnAboutDevicesWithoutSession, Math.min(...deadlines) - Date.now());
    }
  }

  const watcher = watchConsoleTargets({
    serverBaseUrl,
    deviceSocketServer,
    onChange: () => warnAboutDevicesWithoutSession(),
    onEntry(entry) {
      const level = LEVEL_BY_TYPE[entry.type];
      if (!level) {
        return;
      }
      const resolved = resolveLogDataAsync(entry, level);
      const device = watcher.targets.size > 1 ? entry.target.deviceName : undefined;
      printed = printed.then(async () =>
        reporter.logDeviceConsole({ level, data: await resolved, device })
      );
    },
  });
  return watcher;
}

async function resolveLogDataAsync(
  entry: ConsoleEntry,
  level: DeviceConsoleLevel
): Promise<string[]> {
  const data = await resolveConsoleArgsAsync(entry.session, entry.args);
  const hasErrorStack = entry.args.some((arg) => arg.subtype === 'error');
  if (level === 'error' && !hasErrorStack && entry.callFrames.length) {
    data.push(formatCallSiteStack(entry.callFrames));
  }
  return data;
}

function formatCallSiteStack(callFrames: CallFrame[]): string {
  return callFrames
    .map(
      (frame) =>
        `\n    at ${frame.functionName || 'anonymous'} (${frame.url}:${frame.lineNumber + 1}:${frame.columnNumber + 1})`
    )
    .join('');
}
