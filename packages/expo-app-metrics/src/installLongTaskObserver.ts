import AppMetrics from './module';

const DEFAULT_LONG_TASK_THRESHOLD_MS = 500;

let installed = false;
let thresholdMs = DEFAULT_LONG_TASK_THRESHOLD_MS;

/**
 * Sets the minimum long task duration that is reported, in milliseconds. Pass `null` or `undefined`
 * to go back to the default of 500 ms.
 *
 * Exported for the packages that wrap this one, not for host apps to call directly.
 *
 * @internal
 */
export function setLongTaskThreshold(value: number | null | undefined): void {
  thresholdMs = value ?? DEFAULT_LONG_TASK_THRESHOLD_MS;
}

/**
 * Reports each `longtask` performance entry longer than the threshold as a `js.exception` warning.
 * React Native sends an entry only after the task ends and without a stack, so a permanent freeze
 * is never reported.
 *
 * Idempotent: only the first call installs. Called automatically when `expo-app-metrics` is
 * imported.
 *
 * @private
 */
export function installLongTaskObserver(): void {
  if (installed) {
    return;
  }
  // Missing on web and on React Native versions without the performance APIs.
  if (
    typeof PerformanceObserver === 'undefined' ||
    !PerformanceObserver.supportedEntryTypes?.includes('longtask')
  ) {
    return;
  }
  installed = true;

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration <= thresholdMs) {
        continue;
      }
      AppMetrics.reportError({
        source: 'longTask',
        type: 'LongTask',
        // A fixed message, so that the dashboard groups all long tasks together.
        message: 'A long task blocked the JavaScript thread',
        isFatal: false,
        durationMs: entry.duration,
      });
    }
  }).observe({ type: 'longtask' });
}
