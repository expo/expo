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
}

interface StreamConsoleLogsOptions {
  serverBaseUrl: string;
  deviceSocketServer: WebSocketServer;
  reporter: DeviceConsoleReporter;
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

/** Prints the console output of each connected app through the terminal reporter. */
export function streamConsoleLogs({
  serverBaseUrl,
  deviceSocketServer,
  reporter,
}: StreamConsoleLogsOptions): ConsoleTargetWatcher {
  let printed = Promise.resolve();

  const watcher = watchConsoleTargets({
    serverBaseUrl,
    deviceSocketServer,
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
