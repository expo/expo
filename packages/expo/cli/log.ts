import { EXPO_PROFILE } from './utils/env';

/** `console.time` but only enabled when `EXPO_PROFILE` is truthy */
export function time(label?: string): void {
  if (EXPO_PROFILE) {
    console.time(label);
  }
}

/** `console.timeEnd` but only enabled when `EXPO_PROFILE` is truthy */
export function timeEnd(label?: string): void {
  if (EXPO_PROFILE) {
    console.timeEnd(label);
  }
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

/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export function exit(message: string, code: number = 1): never {
  if (code === 0) {
    log(message);
  } else {
    error(message);
  }

  process.exit(code);
}
