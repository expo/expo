import chalk from 'chalk';

// NOTE(@kitten): LogRespectingTerminal in instantiateMetro regressed on fatal errors and
// logs may be swallowed before exiting. We redirect them to a direct write when we're about to exit
let isExiting = false;

export function time(label?: string): void {
  console.time(label);
}

export function timeEnd(label?: string): void {
  console.timeEnd(label);
}

export function error(...message: string[]): void {
  if (isExiting) {
    // `console.error` may be patched to route through an async stderr queue
    // (see LogRespectingTerminal in instantiateMetro.ts). On the exit path
    // that queue has no chance to drain before `process.exit`, so write
    // synchronously to bypass it.
    process.stderr.write(message.join(' ') + '\n');
    return;
  }
  console.error(...message);
}

/** Print an error and provide additional info (the stack trace) in debug mode. */
export function exception(e: Error): void {
  const { env } = require('./utils/env');
  error(chalk.red(e.toString()) + (env.EXPO_DEBUG ? '\n' + chalk.gray(e.stack) : ''));
}

export function warn(...message: string[]): void {
  if (isExiting) {
    process.stderr.write(message.map((value) => chalk.yellow(value)).join(' ') + '\n');
    return;
  }
  console.warn(...message.map((value) => chalk.yellow(value)));
}

/**
 * Whether anything has gone to stdout on this run.
 *
 * @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
 * For the one reader that has to know: the crash handler (`src/utils/errors.ts`). A `--json` run puts
 * **one** object on stdout, and a crash that lands *after* the command printed its report would add a
 * second — leaving `JSON.parse(stdout)` broken on output that was otherwise complete. So the envelope
 * is printed only when stdout is still empty, and the crash is reported on stderr either way
 * [found by verifying the wave-22 fix against the published bundle, 2026-08-27].
 */
let wroteToStdout = false;

/** Whether {@link log} has written anything yet. See {@link wroteToStdout}. */
export function hasWrittenToStdout(): boolean {
  return wroteToStdout;
}

/** Forget what this run printed. For tests, and for nothing else. */
export function resetStdoutTracking(): void {
  wroteToStdout = false;
}

export function log(...message: string[]): void {
  wroteToStdout = true;
  if (isExiting) {
    process.stdout.write(message.join(' ') + '\n');
    return;
  }
  console.log(...message);
}

/**
 * A line about work in progress, on stderr.
 *
 * @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — `stdout` carries one object and
 * nothing else, and `stderr` is where progress goes. So this is **not** {@link log}: a progress
 * line on stdout would put a second thing there and break `JSON.parse(stdout)` for every `--json`
 * caller.
 *
 * Not {@link warn} either, which colours yellow. Nothing here is going wrong; the run is telling
 * the reader what it is about to spend their time on, which is a different thing to say and has to
 * look different.
 */
export function progress(...message: string[]): void {
  process.stderr.write(message.join(' ') + '\n');
}

/** @deprecated use `debug` package with the `expo:` prefix instead.  */
export function debug(...message: any[]): void {
  if (require('./utils/env').env.EXPO_DEBUG) console.log(...message);
}

/** Clear the terminal of all text. */
export function clear(): void {
  process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}

/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export function exit(message: string | Error, code: number = 1): never {
  isExiting = true;
  if (message instanceof Error) {
    exception(message);
  } else if (message) {
    if (code === 0) {
      log(message);
    } else {
      error(message);
    }
  }
  process.exit(code);
}

// The re-export makes auto importing easier.
export const Log = {
  time,
  timeEnd,
  error,
  exception,
  warn,
  log,
  debug,
  clear,
  exit,
};
