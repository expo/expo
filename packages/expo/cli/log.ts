import { EXPO_PROFILE } from './utils/env';

export const time: (label?: string) => void = EXPO_PROFILE ? console.time : () => {};

export const timeEnd: (label?: string) => void = EXPO_PROFILE ? console.timeEnd : () => {};

export function error(...message: string[]) {
  console.error(...message);
}

export function warn(...message: string[]) {
  console.warn(...message);
}

export function log(...message: string[]) {
  console.log(...message);
}

export function exit(message: string, code = 1) {
  if (code === 0) {
    console.log(message);
  } else {
    error(message);
  }

  process.exit(code);
}
