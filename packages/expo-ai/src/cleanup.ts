import { normalizeError } from './LanguageModelError';

/** Runs every cleanup action and reports only the first failure when no task error exists. */
export function runCleanup(actions: readonly (() => void)[], taskFailed = false): void {
  let failed = false;
  let failure: unknown;
  for (const action of actions) {
    try {
      action();
    } catch (cause) {
      if (!failed) failure = cause;
      failed = true;
    }
  }
  if (failed && !taskFailed) throw normalizeError(failure);
}
