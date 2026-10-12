import { AppState } from 'react-native';

import { createNavigationBlockingTime } from '../blockingTime';

let now = 1000;
const originalObserver = globalThis.PerformanceObserver;
const originalAppStateCurrentState = Object.getOwnPropertyDescriptor(AppState, 'currentState');

class MockPerformanceObserver {
  static latest: MockPerformanceObserver;
  static supportedEntryTypes = ['longtask'];
  callback: PerformanceObserverCallback;
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn<PerformanceEntry[], []>(() => []);

  constructor(callback: PerformanceObserverCallback) {
    this.callback = callback;
    MockPerformanceObserver.latest = this;
  }

  emit(...entries: PerformanceEntry[]) {
    // Only getEntries is used by the measurement callback.
    this.callback({ getEntries: () => entries } as PerformanceObserverEntryList, this);
  }
}

function longTask(startTime: number, duration: number): PerformanceEntry {
  // The measurement uses these three fields of a native longtask entry.
  return { entryType: 'longtask', startTime, duration } as PerformanceEntry;
}

function setAppState(state: string) {
  Object.defineProperty(AppState, 'currentState', { configurable: true, value: state });
}

function changeAppState(state: string) {
  setAppState(state);
  jest.mocked(AppState.addEventListener).mock.lastCall![1](state as any);
}

const metric = {
  timestamp: '2026-01-01T00:00:00.000Z',
  category: 'navigation',
  name: 'tbt',
  routeName: '/b',
} as const;

function endWindow() {
  now = 3000;
  jest.advanceTimersByTime(2000);
  jest.runOnlyPendingTimers();
}

beforeEach(() => {
  jest.useFakeTimers();
  now = 1000;
  setAppState('active');
  MockPerformanceObserver.supportedEntryTypes = ['longtask'];
  jest.spyOn(performance, 'now').mockImplementation(() => now);
  jest.spyOn(AppState, 'addEventListener');
  Object.defineProperty(globalThis, 'PerformanceObserver', {
    configurable: true,
    value: MockPerformanceObserver,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  Object.defineProperty(globalThis, 'PerformanceObserver', {
    configurable: true,
    value: originalObserver,
  });
  if (originalAppStateCurrentState) {
    Object.defineProperty(AppState, 'currentState', originalAppStateCurrentState);
  }
});

describe('createNavigationBlockingTime', () => {
  it('does not measure when the API is absent', () => {
    Object.defineProperty(globalThis, 'PerformanceObserver', {
      configurable: true,
      value: undefined,
    });
    expect(createNavigationBlockingTime(jest.fn())).toBeUndefined();
  });

  it('does not measure when longtask entries are unsupported', () => {
    MockPerformanceObserver.supportedEntryTypes = ['mark'];
    expect(createNavigationBlockingTime(jest.fn())).toBeUndefined();
  });

  it('uses one observer for successive navigations', () => {
    const blockingTime = createNavigationBlockingTime(jest.fn())!;
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(1);
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledWith({ type: 'longtask' });

    blockingTime.start();
    blockingTime.start();
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(1);
  });

  it('sums blocking portions of long tasks inside the two-second window', () => {
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    blockingTime.start();
    blockingTime.setMetric(metric);
    MockPerformanceObserver.latest.emit(
      longTask(1010, 120),
      longTask(1200, 40),
      longTask(1400, 100)
    );

    endWindow();
    expect(onMeasured).toHaveBeenCalledTimes(1);
    expect(onMeasured).toHaveBeenCalledWith({ ...metric, value: 0.12 });
  });

  it('counts only the blocking portion that overlaps the window', () => {
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    blockingTime.start();
    blockingTime.setMetric(metric);
    MockPerformanceObserver.latest.emit(
      longTask(900, 200),
      longTask(2950, 200),
      longTask(2900, 200),
      longTask(700, 100),
      longTask(3100, 100)
    );

    endWindow();
    expect(onMeasured).toHaveBeenCalledWith({ ...metric, value: 0.15 });
  });

  it('flushes queued entries before reporting and reports once', () => {
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    blockingTime.start();
    blockingTime.setMetric(metric);
    MockPerformanceObserver.latest.takeRecords.mockReturnValueOnce([longTask(1100, 110)]);

    endWindow();
    expect(MockPerformanceObserver.latest.takeRecords).toHaveBeenCalledTimes(1);
    expect(onMeasured).toHaveBeenCalledWith({ ...metric, value: 0.06 });
    jest.advanceTimersByTime(2000);
    expect(onMeasured).toHaveBeenCalledTimes(1);
  });

  it('does not report a navigation without a metric', () => {
    const onMeasured = jest.fn();
    createNavigationBlockingTime(onMeasured)!.start();
    endWindow();
    expect(onMeasured).not.toHaveBeenCalled();
  });

  it('does not set the metric after the window ends', () => {
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    blockingTime.start();
    now = 3001;
    blockingTime.setMetric(metric);
    endWindow();
    expect(onMeasured).not.toHaveBeenCalled();
  });

  it('keeps the first metric of a navigation', () => {
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    blockingTime.start();
    blockingTime.setMetric(metric);
    blockingTime.setMetric({ ...metric, routeName: '/c' });
    endWindow();
    expect(onMeasured).toHaveBeenCalledWith({ ...metric, value: 0 });
  });

  it('ends the previous window early when a new navigation starts', () => {
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    blockingTime.start();
    blockingTime.setMetric(metric);
    now = 1200;
    blockingTime.start();
    blockingTime.setMetric({ ...metric, routeName: '/c' });
    expect(onMeasured).not.toHaveBeenCalled();

    // The task that started the second navigation is reported after it ends.
    now = 1300;
    MockPerformanceObserver.latest.emit(longTask(1100, 200));
    jest.advanceTimersToNextTimer();
    expect(onMeasured).toHaveBeenCalledWith({ ...metric, value: 0.05 });

    MockPerformanceObserver.latest.emit(longTask(1350, 100));
    now = 3200;
    jest.advanceTimersByTime(2000);
    jest.runOnlyPendingTimers();
    expect(onMeasured).toHaveBeenLastCalledWith({ ...metric, routeName: '/c', value: 0.15 });
  });

  it('cancels the window and stops observing in the background', () => {
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    blockingTime.start();
    blockingTime.setMetric(metric);

    changeAppState('background');
    expect(MockPerformanceObserver.latest.disconnect).toHaveBeenCalledTimes(1);
    blockingTime.start();
    endWindow();
    expect(onMeasured).not.toHaveBeenCalled();

    changeAppState('active');
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(2);
  });

  it('does not observe or measure until the app is active', () => {
    setAppState('background');
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    expect(MockPerformanceObserver.latest.observe).not.toHaveBeenCalled();
    blockingTime.start();
    blockingTime.setMetric(metric);
    endWindow();
    expect(onMeasured).not.toHaveBeenCalled();

    changeAppState('active');
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(1);
  });

  it('cancels the window and removes listeners on dispose', () => {
    const remove = jest.fn();
    jest.mocked(AppState.addEventListener).mockReturnValueOnce({ remove });
    const onMeasured = jest.fn();
    const blockingTime = createNavigationBlockingTime(onMeasured)!;
    blockingTime.start();
    blockingTime.setMetric(metric);

    blockingTime.dispose();
    endWindow();
    expect(onMeasured).not.toHaveBeenCalled();
    expect(MockPerformanceObserver.latest.disconnect).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
