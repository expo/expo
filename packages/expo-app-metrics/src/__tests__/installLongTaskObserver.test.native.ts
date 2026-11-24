/* eslint-disable @typescript-eslint/no-require-imports */
export {};

const mockAppMetrics = {
  reportError: jest.fn(),
};

type EntryListCallback = (list: { getEntries: () => { duration: number }[] }) => void;

let observerCallback: EntryListCallback | undefined;
let observedOptions: unknown[];

class MockPerformanceObserver {
  static supportedEntryTypes = ['mark', 'measure', 'longtask'];

  constructor(callback: EntryListCallback) {
    observerCallback = callback;
  }

  observe(options: unknown) {
    observedOptions.push(options);
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  jest.doMock('../module', () => ({ __esModule: true, default: mockAppMetrics }));
  observerCallback = undefined;
  observedOptions = [];
  MockPerformanceObserver.supportedEntryTypes = ['mark', 'measure', 'longtask'];
  (globalThis as any).PerformanceObserver = MockPerformanceObserver;
});

afterEach(() => {
  delete (globalThis as any).PerformanceObserver;
});

function loadModule() {
  return require('../installLongTaskObserver') as typeof import('../installLongTaskObserver');
}

function emitLongTasks(...durations: number[]) {
  observerCallback!({ getEntries: () => durations.map((duration) => ({ duration })) });
}

describe('installLongTaskObserver', () => {
  it('observes long task entries', () => {
    loadModule().installLongTaskObserver();
    expect(observedOptions).toEqual([{ type: 'longtask' }]);
  });

  it('reports a long task over 500 ms as a long task error with its duration', () => {
    loadModule().installLongTaskObserver();
    emitLongTasks(812.4);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledWith({
      source: 'longTask',
      type: 'LongTask',
      message: 'A long task blocked the JavaScript thread',
      isFatal: false,
      durationMs: 812.4,
    });
  });

  it('does not report a long task of 500 ms or less', () => {
    loadModule().installLongTaskObserver();
    emitLongTasks(120, 500);
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
  });

  it('installs only once', () => {
    const module = loadModule();
    module.installLongTaskObserver();
    module.installLongTaskObserver();
    expect(observedOptions).toHaveLength(1);
  });

  it('does nothing when the runtime has no PerformanceObserver', () => {
    delete (globalThis as any).PerformanceObserver;
    expect(() => loadModule().installLongTaskObserver()).not.toThrow();
  });

  it('does nothing when the runtime does not support long task entries', () => {
    MockPerformanceObserver.supportedEntryTypes = ['mark', 'measure'];
    loadModule().installLongTaskObserver();
    expect(observedOptions).toHaveLength(0);
  });
});

describe('setLongTaskThreshold', () => {
  it('reports only long tasks over the new threshold', () => {
    const module = loadModule();
    module.installLongTaskObserver();
    module.setLongTaskThreshold(1000);
    emitLongTasks(812, 1200);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ durationMs: 1200 })
    );
  });

  it('goes back to 500 ms when the threshold is cleared', () => {
    const module = loadModule();
    module.installLongTaskObserver();
    module.setLongTaskThreshold(1000);
    module.setLongTaskThreshold(undefined);
    emitLongTasks(500, 501);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledWith(
      expect.objectContaining({ durationMs: 501 })
    );
  });
});
