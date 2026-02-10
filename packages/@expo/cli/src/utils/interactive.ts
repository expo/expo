import { env } from './env';

/** @returns `true` if the process is interactive. */
export function isInteractive(): boolean {
  return !env.CI && !env.EXPO_UNSTABLE_JSONL_OUTPUT && process.stdout.isTTY;
}
