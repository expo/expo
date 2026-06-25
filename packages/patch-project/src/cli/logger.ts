import { styleText } from 'node:util';

import * as env from '../env';

export const log = console.log;
export const error = console.error;

/** Print an error and provide additional info (the stack trace) in debug mode. */
export function exception(e: Error): void {
  error(styleText('red', e.toString()) + (env.EXPO_DEBUG ? '\n' + styleText('gray', e.stack!) : ''));
}

/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export function exit(message: string | Error, code: number = 1): never {
  if (message instanceof Error) {
    exception(message);
    process.exit(code);
  }

  if (message) {
    if (code === 0) {
      log(message);
    } else {
      error(message);
    }
  }

  process.exit(code);
}
