const WINDOW_MS = 2000;
const LONG_TASK_THRESHOLD_MS = 50;

export interface BlockingTimeMeasurement {
  readonly deadline: number;
  finish(): void;
  cancel(): void;
}

export function createBlockingTimeObserver(observeImmediately = true) {
  if (
    typeof PerformanceObserver === 'undefined' ||
    !PerformanceObserver.supportedEntryTypes?.includes('longtask')
  ) {
    return;
  }

  type Window = {
    start: number;
    end: number;
    blockingTimeMs: number;
    timer?: ReturnType<typeof setTimeout>;
  };
  const windows = new Set<Window>();

  const addEntries = (entries: PerformanceEntry[]) => {
    for (const current of windows) {
      for (const entry of entries) {
        // Only the part after a task's first 50ms contributes to TBT.
        current.blockingTimeMs += Math.max(
          0,
          Math.min(entry.startTime + entry.duration, current.end) -
            Math.max(entry.startTime + LONG_TASK_THRESHOLD_MS, current.start)
        );
      }
    }
  };

  const observer = new PerformanceObserver((list) => addEntries(list.getEntries()));
  const observe = () => observer.observe({ type: 'longtask' });
  if (observeImmediately) observe();

  return {
    start(onComplete: (blockingTimeMs: number) => void): BlockingTimeMeasurement {
      const start = performance.now();
      const current: Window = {
        start,
        end: start + WINDOW_MS,
        blockingTimeMs: 0,
      };
      const cancel = () => {
        if (!windows.delete(current)) return;
        if (current.timer !== undefined) clearTimeout(current.timer);
      };
      const complete = () => {
        if (!windows.has(current)) return;
        addEntries(observer.takeRecords());
        const value = current.blockingTimeMs;
        cancel();
        onComplete(value);
      };
      const finish = () => {
        if (!windows.has(current)) return;
        current.end = Math.min(current.end, performance.now());
        if (current.timer !== undefined) clearTimeout(current.timer);
        current.timer = setTimeout(complete, 0);
      };
      current.timer = setTimeout(finish, WINDOW_MS);
      windows.add(current);
      return { deadline: current.end, finish, cancel };
    },
    observe,
    disconnect() {
      for (const current of windows) {
        if (current.timer !== undefined) clearTimeout(current.timer);
      }
      windows.clear();
      observer.disconnect();
    },
  };
}
