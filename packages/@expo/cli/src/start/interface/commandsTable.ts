import { ExpoConfig } from '@expo/config';
import chalk from 'chalk';
import qrcode from 'qrcode-terminal';
import wrapAnsi from 'wrap-ansi';

import * as Log from '../../log';

export const BLT = '\u203A';

export type StartOptions = {
  isWebSocketsEnabled?: boolean;
  devClient?: boolean;
  reset?: boolean;
  nonPersistent?: boolean;
  maxWorkers?: number;
  platforms?: ExpoConfig['platforms'];
};

export const printHelp = (): void => {
  logCommandsTable([{ key: '?', msg: 'show all commands' }]);
};

/** Print the world famous 'Expo QR Code'. */
export function printQRCode(url: string) {
  qrcode.generate(url, { small: true }, (code) => Log.log(code));
}

export const getTerminalColumns = () => process.stdout.columns || 80;
export const printItem = (text: string): string =>
  `${BLT} ` + wrapAnsi(text, getTerminalColumns()).trimStart();

export function printUsage(
  options: Pick<StartOptions, 'devClient' | 'isWebSocketsEnabled' | 'platforms'>,
  { verbose }: { verbose: boolean }
) {
  const isMac = process.platform === 'darwin';

  const { platforms = ['ios', 'android', 'web'] } = options;

  const isAndroidDisabled = !platforms.includes('android');
  const isIosDisabled = !platforms.includes('ios');
  const isWebDisable = !platforms.includes('web');

  const switchMsg = `switch to ${options.devClient === false ? 'development build' : 'Expo Go'}`;
  const target = options.devClient === false ? `Expo Go` : 'development build';

  Log.log();
  Log.log(printItem(chalk`Using {cyan ${target}}`));

  if (verbose) {
    logCommandsTable([
      { key: 's', msg: switchMsg },
      {},
      { key: 'a', msg: 'open Android', disabled: isAndroidDisabled },
      { key: 'shift+a', msg: 'select a device or emulator', disabled: isAndroidDisabled },
      isMac && { key: 'i', msg: 'open iOS simulator', disabled: isIosDisabled },
      isMac && { key: 'shift+i', msg: 'select a simulator', disabled: isIosDisabled },
      { key: 'w', msg: 'open web', disabled: isWebDisable },
      {},
      { key: 'r', msg: 'reload app' },
      !!options.isWebSocketsEnabled && { key: 'j', msg: 'open debugger' },
      !!options.isWebSocketsEnabled && { key: 'm', msg: 'toggle menu' },
      !!options.isWebSocketsEnabled && { key: 'shift+m', msg: 'more tools' },
      { key: 'o', msg: 'open project code in your editor' },
      { key: 'c', msg: 'show project QR' },
      {},
    ]);
  } else {
    logCommandsTable([
      { key: 's', msg: switchMsg },
      {},
      { key: 'a', msg: 'open Android', disabled: isAndroidDisabled },
      isMac && { key: 'i', msg: 'open iOS simulator', disabled: isIosDisabled },
      { key: 'w', msg: 'open web', disabled: isWebDisable },
      {},
      { key: 'j', msg: 'open debugger' },
      { key: 'r', msg: 'reload app' },
      !!options.isWebSocketsEnabled && { key: 'm', msg: 'toggle menu' },
      { key: 'o', msg: 'open project code in your editor' },
      {},
    ]);
  }
}

function logCommandsTable(
  ui: (false | { key?: string; msg?: string; status?: string; disabled?: boolean })[]
) {
  Log.log(
    ui
      .filter(Boolean)
      // @ts-ignore: filter doesn't work
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
      })
      .join('\n')
  );
}
