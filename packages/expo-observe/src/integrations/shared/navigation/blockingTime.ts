import type { MetricInput } from 'expo-app-metrics';
import { AppState } from 'react-native';

// Navigation Total Blocking Time follows Coinbase's Performance Vitals definition: blocking time
// in the 2 seconds after a user navigates.
// https://www.coinbase.com/blog/performance-vitals-a-unified-scoring-system-to-guide-performance-health-and-prioritization
const WINDOW_MS = 2000;
// Same 50ms threshold as the Long Tasks API. Only the time past 50ms counts.
// https://w3c.github.io/longtasks/
const LONG_TASK_THRESHOLD_MS = 50;

type NavigationMetric = Omit<MetricInput, 'value'>;

type Window = {
  start: number;
  timer: ReturnType<typeof setTimeout>;
  metric?: NavigationMetric;
};

export type NavigationBlockingTime = ReturnType<typeof createNavigationBlockingTime>;

export function createNavigationBlockingTime(onMeasured: (metric: MetricInput) => void) {
  if (
    typeof PerformanceObserver === 'undefined' ||
    !PerformanceObserver.supportedEntryTypes?.includes('longtask')
  ) {
    return;
  }

  let current: Window | undefined;
  // Kept across windows, because React Native reports long tasks at idle priority, often after
  // the navigation that the task belongs to starts its window.
  let longTasks: PerformanceEntry[] = [];

  const addLongTasks = (entries: PerformanceEntry[]) => {
    const cutoff = Math.min(performance.now() - WINDOW_MS, current?.start ?? Infinity);
    longTasks = [...longTasks, ...entries].filter(
      (entry) => entry.startTime + entry.duration > cutoff
    );
  };

  const observer = new PerformanceObserver((list) => addLongTasks(list.getEntries()));
  const observe = () => observer.observe({ type: 'longtask' });

  const cancel = () => {
    clearTimeout(current?.timer);
    current = undefined;
  };

  const complete = (window: Window) => {
    addLongTasks(observer.takeRecords());
    current = undefined;
    if (!window.metric) return;
    let blockingTimeMs = 0;
    for (const entry of longTasks) {
      blockingTimeMs += Math.max(
        0,
        Math.min(entry.startTime + entry.duration, window.start + WINDOW_MS) -
          Math.max(entry.startTime + LONG_TASK_THRESHOLD_MS, window.start)
      );
    }
    onMeasured({ ...window.metric, value: blockingTimeMs / 1000 });
  };

  const stop = () => {
    cancel();
    longTasks = [];
    observer.disconnect();
  };

  if (AppState.currentState === 'active') observe();
  const appStateSubscription = AppState.addEventListener('change', (state) =>
    state === 'active' ? observe() : stop()
  );

  return {
    // Starts a window for a new navigation and drops the previous one without reporting it.
    start(startTime: number) {
      if (AppState.currentState !== 'active') return;
      cancel();
      const window: Window = {
        start: startTime,
        timer: setTimeout(
          () => complete(window),
          Math.max(0, startTime + WINDOW_MS - performance.now())
        ),
      };
      current = window;
    },
    // Sets the metric of the latest navigation. Navigations without a metric are not reported.
    setMetric(metric: NavigationMetric, focusTime: number) {
      if (current && !current.metric && focusTime <= current.start + WINDOW_MS) {
        current.metric = metric;
      }
    },
    dispose() {
      stop();
      appStateSubscription.remove();
    },
  };
}
