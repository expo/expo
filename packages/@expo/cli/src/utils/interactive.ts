import { env } from './env';

/** @returns `true` if the process is interactive. */
export function isInteractive(): boolean {
  return !env.CI && process.stdout.isTTY;
}
