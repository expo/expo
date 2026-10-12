import { createBlockingTimeObserver } from '../blockingTime';

let now = 1000;
const originalObserver = globalThis.PerformanceObserver;

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

beforeEach(() => {
  jest.useFakeTimers();
  now = 1000;
  MockPerformanceObserver.supportedEntryTypes = ['longtask'];
  jest.spyOn(performance, 'now').mockImplementation(() => now);
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
});

describe('createBlockingTimeObserver', () => {
  it('does not create an observer when the API is absent', () => {
    Object.defineProperty(globalThis, 'PerformanceObserver', {
      configurable: true,
      value: undefined,
    });
    expect(createBlockingTimeObserver()).toBeUndefined();
  });

  it('does not create an observer when longtask entries are unsupported', () => {
    MockPerformanceObserver.supportedEntryTypes = ['mark'];
    expect(createBlockingTimeObserver()).toBeUndefined();
  });

  it('uses one observer for successive navigation windows', () => {
    const measurement = createBlockingTimeObserver()!;
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(1);
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledWith({ type: 'longtask' });

    measurement.start(jest.fn()).finish();
    measurement.start(jest.fn()).finish();
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(1);
  });

  it('sums blocking portions of long tasks inside the two-second window', () => {
    const onComplete = jest.fn();
    createBlockingTimeObserver()!.start(onComplete);
    MockPerformanceObserver.latest.emit(
      longTask(1010, 120),
      longTask(1200, 40),
      longTask(1400, 100)
    );

    now = 3000;
    jest.advanceTimersByTime(2000);
    jest.runOnlyPendingTimers();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(120);
  });

  it('counts only the blocking portion that overlaps the window', () => {
    const onComplete = jest.fn();
    createBlockingTimeObserver()!.start(onComplete);
    MockPerformanceObserver.latest.emit(
      longTask(900, 200),
      longTask(2950, 200),
      longTask(2900, 200),
      longTask(700, 100),
      longTask(3100, 100)
    );

    now = 3000;
    jest.advanceTimersByTime(2000);
    jest.runOnlyPendingTimers();
    expect(onComplete).toHaveBeenCalledWith(150);
  });

  it('flushes queued entries before the timer reports and reports once', () => {
    const onComplete = jest.fn();
    createBlockingTimeObserver()!.start(onComplete);
    MockPerformanceObserver.latest.takeRecords.mockReturnValueOnce([longTask(1100, 110)]);

    now = 3000;
    jest.advanceTimersByTime(2000);
    jest.runOnlyPendingTimers();
    expect(MockPerformanceObserver.latest.takeRecords).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(60);
    jest.advanceTimersByTime(2000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('keeps a finished window open until the running native task is reported', () => {
    const first = jest.fn();
    const second = jest.fn();
    const measurement = createBlockingTimeObserver()!;
    const initial = measurement.start(first);
    now = 1200;
    initial.finish();
    expect(first).not.toHaveBeenCalled();

    measurement.start(second);
    now = 1300;
    MockPerformanceObserver.latest.emit(longTask(1100, 200));
    jest.advanceTimersToNextTimer();
    expect(first).toHaveBeenCalledWith(50);

    MockPerformanceObserver.latest.emit(longTask(1350, 100));
    now = 3200;
    jest.advanceTimersByTime(2000);
    jest.runOnlyPendingTimers();
    expect(second).toHaveBeenCalledWith(150);
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(1);
  });

  it('cancels without reporting and disconnects on cleanup', () => {
    const onComplete = jest.fn();
    const measurement = createBlockingTimeObserver()!;
    const current = measurement.start(onComplete);
    current.cancel();
    MockPerformanceObserver.latest.emit(longTask(1100, 120));
    now = 3000;
    jest.advanceTimersByTime(2000);
    current.finish();
    expect(onComplete).not.toHaveBeenCalled();

    measurement.disconnect();
    expect(MockPerformanceObserver.latest.disconnect).toHaveBeenCalledTimes(1);
  });

  it('re-observes the same observer after backgrounding', () => {
    const measurement = createBlockingTimeObserver()!;
    measurement.disconnect();
    measurement.observe();
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(2);
  });

  it('does not observe until requested when created inactive', () => {
    const measurement = createBlockingTimeObserver(false)!;
    expect(MockPerformanceObserver.latest.observe).not.toHaveBeenCalled();
    measurement.observe();
    expect(MockPerformanceObserver.latest.observe).toHaveBeenCalledTimes(1);
  });
});
