import { env } from './env';

/** Determine if the current process is interactive, and can receive user input */
export function isInteractive(): boolean {
  return !env.CI && process.stdout.isTTY;
}
