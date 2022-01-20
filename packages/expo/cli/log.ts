import { EXPO_DEBUG } from './utils/env';

/** Clear the terminal of all text. */
export function clear(): void {
  process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H');
}

export function time(label?: string): void {
  console.time(label);
}

export function timeEnd(label?: string): void {
  console.timeEnd(label);
}

export function error(...message: string[]): void {
  console.error(...message);
}

export function warn(...message: string[]): void {
  console.warn(...message);
}

export function log(...message: string[]): void {
  console.log(...message);
}

export function debug(...message: string[]): void {
  if (EXPO_DEBUG) console.log(...message);
}

/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export function exit(message: string, code: number = 1): never {
  if (code === 0) {
    log(message);
  } else {
    error(message);
  }

  process.exit(code);
}
