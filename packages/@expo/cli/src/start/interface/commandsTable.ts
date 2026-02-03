import { ExpoConfig } from '@expo/config';
import chalk from 'chalk';
import wrapAnsi from 'wrap-ansi';

import * as Log from '../../log';
import type { McpServer } from '../server/MCP';

// Approximately how many rows apart from the commands table (usage guide on `expo start`)
// will be printed after the QR code? The `rows` input doesn't account for all of them,
// so we add our best guess instead.
const RESERVED_ROWS = 6;

export const BLT = '\u203A';

export type StartOptions = {
  isWebSocketsEnabled?: boolean;
  devClient?: boolean;
  reset?: boolean;
  nonPersistent?: boolean;
  maxWorkers?: number;
  platforms?: ExpoConfig['platforms'];
  mcpServer?: McpServer;
};

export const printHelp = (): void => {
  logCommandsTable([{ key: '?', msg: 'show all commands' }]).print();
};

export const getTerminalColumns = () => process.stdout.columns || 80;
export const printItem = (text: string): string =>
  `${BLT} ` + wrapAnsi(text, getTerminalColumns()).trimStart();

export function printUsage(
  options: Pick<StartOptions, 'devClient' | 'isWebSocketsEnabled' | 'platforms'>,
  { verbose, rows }: { verbose: boolean; rows?: number }
) {
  const isMac = process.platform === 'darwin';

  const { platforms = ['ios', 'android', 'web'] } = options;

  const isAndroidDisabled = !platforms.includes('android');
  const isIosDisabled = !platforms.includes('ios');
  const isWebDisable = !platforms.includes('web');

  const switchMsg = `switch to ${options.devClient === false ? 'development build' : 'Expo Go'}`;
  const target = options.devClient === false ? `Expo Go` : 'development build';

  const printPrefix = ({ short }: { short: boolean }) => {
    Log.log();
    let message = chalk`Using {cyan ${target}}`;
    if (!short) {
      message += chalk` {dim │ Press {bold s} to ${switchMsg}}`;
    }
    Log.log(printItem(message));
  };

  if (verbose) {
    printPrefix({ short: true });
    return logCommandsTable([
      { key: 's', msg: switchMsg },
      {},
      { key: 'a', msg: 'open Android', disabled: isAndroidDisabled },
      { key: 'shift+a', msg: 'select an Android device or emulator', disabled: isAndroidDisabled },
      isMac && { key: 'i', msg: 'open iOS simulator', disabled: isIosDisabled },
      isMac && { key: 'shift+i', msg: 'select an iOS simulator', disabled: isIosDisabled },
      { key: 'w', msg: 'open web', disabled: isWebDisable },
      {},
      { key: 'r', msg: 'reload app' },
      !!options.isWebSocketsEnabled && { key: 'j', msg: 'open debugger' },
      !!options.isWebSocketsEnabled && { key: 'm', msg: 'toggle menu' },
      !!options.isWebSocketsEnabled && { key: 'shift+m', msg: 'more tools' },
      { key: 'o', msg: 'open project code in your editor' },
      { key: 'c', msg: 'show project QR' },
      {},
    ]).print();
  }

  const table = logCommandsTable([
    { key: 's', msg: switchMsg },
    {},
    { key: 'a', msg: 'open Android', disabled: isAndroidDisabled },
    isMac && { key: 'i', msg: 'open iOS simulator', disabled: isIosDisabled },
    { key: 'w', msg: 'open web', disabled: isWebDisable },
    {},
    { key: 'j', msg: 'open debugger' },
    { key: 'r', msg: 'reload app' },
    !!options.isWebSocketsEnabled && { key: 'm', msg: 'toggle menu' },
    !!options.isWebSocketsEnabled && { key: 'shift+m', msg: 'more tools' },
    { key: 'o', msg: 'open project code in your editor' },
    {},
  ]);

  // If we're not in verbose mode, we check if we have enough space. If we don't, we don't print
  // the full usage guide and rely on the `printHelp()` message being shown instead
  if ((rows || Infinity) - RESERVED_ROWS > table.lines) {
    printPrefix({ short: true });
    table.print();
  } else {
    printPrefix({ short: false });
  }
}

interface LogCommandsOutput {
  lines: number;
  print(): void;
}

function logCommandsTable(
  ui: (false | { key?: string; msg?: string; status?: string; disabled?: boolean })[]
) {
  const lines = ui
    .filter((x) => !!x)
    .map(({ key, msg, status, disabled }) => {
      if (!key) return '';
      let view = `${BLT} `;
      if (key.length === 1) view += 'Press ';
      view += chalk`{bold ${key}} {dim │} `;
      view += msg;
      if (status) {
        view += ` ${chalk.dim(`(${chalk.italic(status)})`)}`;
      }
      if (disabled) {
        view = chalk.dim(view);
      }
      return view;
    });
  return {
    lines: lines.length,
    print() {
      Log.log(lines.join('\n'));
    },
  };
}
