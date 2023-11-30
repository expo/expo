import chalk from 'chalk';
import oraReal, { Ora } from 'ora';

import { env } from './env';
import { isInteractive } from './interactive';

// eslint-disable-next-line no-console
const logReal = console.log;
// eslint-disable-next-line no-console
const infoReal = console.info;
// eslint-disable-next-line no-console
const warnReal = console.warn;
// eslint-disable-next-line no-console
const errorReal = console.error;

/**
 * A custom ora spinner that sends the stream to stdout in CI, non-TTY, or expo's non-interactive flag instead of stderr (the default).
 *
 * @param options
 * @returns
 */
export function ora(options?: oraReal.Options | string): oraReal.Ora {
  const inputOptions = typeof options === 'string' ? { text: options } : options || {};
  const disabled = !isInteractive() || env.EXPO_DEBUG;
  const spinner = oraReal({
    // Ensure our non-interactive mode emulates CI mode.
    isEnabled: !disabled,
    // In non-interactive mode, send the stream to stdout so it prevents looking like an error.
    stream: disabled ? process.stdout : process.stderr,
    ...inputOptions,
  });

  const oraStart = spinner.start.bind(spinner);
  const oraStop = spinner.stop.bind(spinner);
  const oraStopAndPersist = spinner.stopAndPersist.bind(spinner);

  const logWrap = (method: any, args: any[]): void => {
    oraStop();
    method(...args);
    spinner.start();
  };

  const wrapNativeLogs = (): void => {
    // eslint-disable-next-line no-console
    console.log = (...args: any) => logWrap(logReal, args);
    // eslint-disable-next-line no-console
    console.info = (...args: any) => logWrap(infoReal, args);
    // eslint-disable-next-line no-console
    console.warn = (...args: any) => logWrap(warnReal, args);
    // eslint-disable-next-line no-console
    console.error = (...args: any) => logWrap(errorReal, args);
  };

  const resetNativeLogs = (): void => {
    // eslint-disable-next-line no-console
    console.log = logReal;
    // eslint-disable-next-line no-console
    console.info = logReal;
    // eslint-disable-next-line no-console
    console.warn = warnReal;
    // eslint-disable-next-line no-console
    console.error = errorReal;
  };

  spinner.start = (text): Ora => {
    wrapNativeLogs();
    return oraStart(text);
  };

  spinner.stopAndPersist = (options): Ora => {
    const result = oraStopAndPersist(options);
    resetNativeLogs();
    return result;
  };

  spinner.stop = (): Ora => {
    const result = oraStop();
    resetNativeLogs();
    return result;
  };

  return spinner;
}

/**
 * Create a unified section spinner.
 *
 * @param title
 * @returns
 */
export function logNewSection(title: string) {
  const spinner = ora(chalk.bold(title));
  // Prevent the spinner from clashing with debug logs
  spinner.start();
  return spinner;
}
