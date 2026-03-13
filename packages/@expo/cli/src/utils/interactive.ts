import { shouldReduceLogs } from '../events';
import { env } from './env';

/** @returns `true` if the process is interactive. */
export function isInteractive(): boolean {
  return !shouldReduceLogs() && !env.CI && process.stdout.isTTY;
}
