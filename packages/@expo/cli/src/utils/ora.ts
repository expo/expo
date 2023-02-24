import chalk from 'chalk';
import oraReal, { Ora } from 'ora';

// import * as Log from '../log';
import { env } from './env';
import { isInteractive } from './interactive';

const logReal = console.log;
const infoReal = console.info;
const warnReal = console.warn;
const errorReal = console.error;

const runningSpinners: oraReal.Ora[] = [];

export function getAllSpinners() {
  return runningSpinners;
}

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
    console.log = (...args: any) => logWrap(logReal, args);
    console.info = (...args: any) => logWrap(infoReal, args);
    console.warn = (...args: any) => logWrap(warnReal, args);
    console.error = (...args: any) => logWrap(errorReal, args);

    runningSpinners.push(spinner);
  };

  const resetNativeLogs = (): void => {
    console.log = logReal;
    console.info = infoReal;
    console.warn = warnReal;
    console.error = errorReal;

    const index = runningSpinners.indexOf(spinner);
    if (index >= 0) {
      runningSpinners.splice(index, 1);
    }
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

  // Always make the central logging module aware of the current spinner
  // Log.setSpinner(spinner);

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
