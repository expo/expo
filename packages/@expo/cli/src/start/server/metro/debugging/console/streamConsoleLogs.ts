import chalk from 'chalk';
import type { WebSocketServer } from 'ws';

import { watchConsoleTargets } from './ConsoleTargetWatcher';
import type { ConsoleTargetWatcher } from './ConsoleTargetWatcher';
import { resolveConsoleArgsAsync } from './resolveConsoleArgs';
import type { CallFrame, ConsoleApiType, ConsoleEntry, ConsoleTarget } from './types';

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

const DEVICE_COLORS = [chalk.cyan, chalk.magenta, chalk.green, chalk.blue];

/** Prints the console output of each connected app through the terminal reporter. */
export function streamConsoleLogs({
  serverBaseUrl,
  deviceSocketServer,
  reporter,
}: StreamConsoleLogsOptions): ConsoleTargetWatcher {
  let printed = Promise.resolve();
  const labelDevice = createDeviceLabeler();

  const watcher = watchConsoleTargets({
    serverBaseUrl,
    deviceSocketServer,
    onEntry(entry) {
      const level = LEVEL_BY_TYPE[entry.type];
      if (!level) {
        return;
      }
      const resolved = resolveLogDataAsync(entry, level);
      const label = labelDevice(entry.target);
      const device = watcher.targets.size > 1 ? label : undefined;
      printed = printed.then(async () =>
        reporter.logDeviceConsole({ level, data: await resolved, device })
      );
    },
  });
  return watcher;
}

/**
 * Labels each device with its name: plain for the first device to log, and in a rotating color for
 * each device after it.
 */
export function createDeviceLabeler(): (target: ConsoleTarget) => string {
  const orderByDevice = new Map<string, number>();
  return (target) => {
    let order = orderByDevice.get(target.logicalDeviceId);
    if (order == null) {
      order = orderByDevice.size;
      orderByDevice.set(target.logicalDeviceId, order);
    }
    if (order === 0) {
      return target.deviceName;
    }
    return DEVICE_COLORS[(order - 1) % DEVICE_COLORS.length]!(target.deviceName);
  };
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
