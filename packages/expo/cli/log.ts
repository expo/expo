import { boolish } from 'getenv';

const isProfiling = boolish('EXPO_PROFILE', false);

export const time: (label?: string) => void = isProfiling ? console.time : () => {};

export const timeEnd: (label?: string) => void = isProfiling ? console.timeEnd : () => {};

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
