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
  timer?: ReturnType<typeof setTimeout>;
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
  // Kept across windows, because React Native reports long tasks at idle priority, often after
  // the navigation that the task belongs to starts its window.
  let longTasks: PerformanceEntry[] = [];

  const addLongTasks = (entries: PerformanceEntry[]) => {
    const cutoff = Math.min(performance.now() - WINDOW_MS, ...[...windows].map((w) => w.start));
    longTasks = [...longTasks, ...entries].filter(
      (entry) => entry.startTime + entry.duration > cutoff
    );
  };

  const observer = new PerformanceObserver((list) => addLongTasks(list.getEntries()));
  const observe = () => observer.observe({ type: 'longtask' });

  const remove = (window: Window) => {
    clearTimeout(window.timer);
    windows.delete(window);
  };

  const complete = (window: Window) => {
    addLongTasks(observer.takeRecords());
    remove(window);
    if (!window.metric) return;
    let blockingTimeMs = 0;
    for (const entry of longTasks) {
      blockingTimeMs += Math.max(
        0,
        Math.min(entry.startTime + entry.duration, window.end) -
          Math.max(entry.startTime + LONG_TASK_THRESHOLD_MS, window.start)
      );
    }
    onMeasured({ ...window.metric, value: blockingTimeMs / 1000 });
  };

  const scheduleComplete = (window: Window) => {
    clearTimeout(window.timer);
    window.timer = setTimeout(() => complete(window), Math.max(0, window.end - performance.now()));
  };

  const stop = () => {
    windows.forEach(remove);
    longTasks = [];
    observer.disconnect();
  };

  if (AppState.currentState === 'active') observe();
  const appStateSubscription = AppState.addEventListener('change', (state) =>
    state === 'active' ? observe() : stop()
  );

  return {
    // Starts a window for a new navigation and ends the previous one early.
    start(startTime: number) {
      if (AppState.currentState !== 'active') return;
      const previous = latestWindow();
      if (previous) {
        previous.end = Math.min(previous.end, startTime);
        scheduleComplete(previous);
      }
      const window: Window = { start: startTime, end: startTime + WINDOW_MS };
      windows.add(window);
      scheduleComplete(window);
    },
    // Sets the metric of the latest navigation. Navigations without a metric are not reported.
    setMetric(metric: NavigationMetric, focusTime: number) {
      const window = latestWindow();
      if (window && !window.metric && focusTime <= window.end) {
        window.metric = metric;
      }
    },
    dispose() {
      stop();
      appStateSubscription.remove();
    },
  };
}
