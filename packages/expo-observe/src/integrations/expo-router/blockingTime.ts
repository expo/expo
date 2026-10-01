const WINDOW_MS = 2000;
// Same long-task threshold as the Web Vitals Total Blocking Time.
const LONG_TASK_THRESHOLD_MS = 50;

export interface BlockingTimeMeasurement {
  /** Ends the measurement early and reports the blocking time collected so far. */
  finish(): void;
  /** Ends the measurement without reporting. */
  cancel(): void;
}

/**
 * Measures how long the JS thread is blocked during the next 2 seconds.
 *
 * Animation frame callbacks run on the JS thread, so a long gap between two
 * of them means the thread was busy. Every gap above 50ms adds the part above
 * 50ms to the total.
 */
export function startBlockingTimeMeasurement(
  onComplete: (blockingTimeMs: number) => void
): BlockingTimeMeasurement {
  let lastFrameTime = performance.now();
  const end = lastFrameTime + WINDOW_MS;
  let blockingTimeMs = 0;
  let frameId: number | undefined;
  let done = false;

  const addGapUntil = (time: number) => {
    const until = Math.min(time, end);
    blockingTimeMs += Math.max(0, until - lastFrameTime - LONG_TASK_THRESHOLD_MS);
    lastFrameTime = until;
  };

  const cancel = () => {
    done = true;
    if (frameId != null) {
      cancelAnimationFrame(frameId);
    }
  };

  const finish = () => {
    if (done) return;
    cancel();
    addGapUntil(performance.now());
    onComplete(blockingTimeMs);
  };

  const onFrame = () => {
    const now = performance.now();
    if (now >= end) {
      finish();
      return;
    }
    addGapUntil(now);
    frameId = requestAnimationFrame(onFrame);
  };

  frameId = requestAnimationFrame(onFrame);
  return { finish, cancel };
}
