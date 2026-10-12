import type { MetricInput } from 'expo-app-metrics';
import { AppState } from 'react-native';

// Navigation Total Blocking Time follows Coinbase's Performance Vitals definition: blocking time
// in the 2 seconds after a user navigates.
// https://www.coinbase.com/blog/performance-vitals-a-unified-scoring-system-to-guide-performance-health-and-prioritization
const WINDOW_MS = 2000;
// Same threshold as the Long Tasks API and web TBT. To respond to input within 100ms (the RAIL
// model), the thread can't stay busy longer than 50ms at a time. Only the time past 50ms counts.
const LONG_TASK_THRESHOLD_MS = 50;

type NavigationMetric = Omit<MetricInput, 'value'>;

type Window = {
  start: number;
  end: number;
  blockingTimeMs: number;
  timer: ReturnType<typeof setTimeout>;
  metric?: NavigationMetric;
};

export function createNavigationBlockingTime(onMeasured: (metric: MetricInput) => void) {
  if (
    typeof PerformanceObserver === 'undefined' ||
    !PerformanceObserver.supportedEntryTypes?.includes('longtask')
  ) {
    return;
  }

  // Open windows in start order. The last one belongs to the latest navigation.
  const windows = new Set<Window>();
  const latestWindow = () => [...windows].pop();

  const addEntries = (entries: PerformanceEntry[]) => {
    for (const window of windows) {
      for (const entry of entries) {
        window.blockingTimeMs += Math.max(
          0,
          Math.min(entry.startTime + entry.duration, window.end) -
            Math.max(entry.startTime + LONG_TASK_THRESHOLD_MS, window.start)
        );
      }
    }
  };

  const observer = new PerformanceObserver((list) => addEntries(list.getEntries()));
  const observe = () => observer.observe({ type: 'longtask' });

  const remove = (window: Window) => {
    clearTimeout(window.timer);
    windows.delete(window);
  };

  const complete = (window: Window) => {
    addEntries(observer.takeRecords());
    remove(window);
    if (window.metric) {
      onMeasured({ ...window.metric, value: window.blockingTimeMs / 1000 });
    }
  };

  // Reports on the next tick, so the long task that is running now is included.
  const finish = (window: Window) => {
    window.end = Math.min(window.end, performance.now());
    clearTimeout(window.timer);
    window.timer = setTimeout(() => complete(window), 0);
  };

  const stop = () => {
    windows.forEach(remove);
    observer.disconnect();
  };

  if (AppState.currentState === 'active') observe();
  const appStateSubscription = AppState.addEventListener('change', (state) =>
    state === 'active' ? observe() : stop()
  );

  return {
    // Starts a window for a new navigation and ends the previous one early.
    start() {
      if (AppState.currentState !== 'active') return;
      const previous = latestWindow();
      if (previous) finish(previous);
      const start = performance.now();
      const window: Window = {
        start,
        end: start + WINDOW_MS,
        blockingTimeMs: 0,
        timer: setTimeout(() => finish(window), WINDOW_MS),
      };
      windows.add(window);
    },
    // Sets the metric of the latest navigation. Navigations without a metric are not reported.
    setMetric(metric: NavigationMetric) {
      const window = latestWindow();
      if (window && !window.metric && performance.now() <= window.end) {
        window.metric = metric;
      }
    },
    dispose() {
      stop();
      appStateSubscription.remove();
    },
  };
}
