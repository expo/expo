import { isEventLoggerActive } from '@expo/event-log';

import { env } from './env';

/** Whether logs shown in the terminal should be reduced.
 * @remarks
 * We indicate that we're in an automated tool (e.g. E2E tests) with `EXPO_UNSTABLE_HEADLESS`.
 * If the event logger is active and we're running in a headless tool, we should reduce
 * interactive or noisy logs, in favour of the event logger.
 */
export const shouldReduceLogs = () => !!isEventLoggerActive() && env.EXPO_UNSTABLE_HEADLESS;

/** @returns `true` if the process is interactive. */
export function isInteractive(): boolean {
  return !shouldReduceLogs() && !env.CI && process.stdout.isTTY;
}
