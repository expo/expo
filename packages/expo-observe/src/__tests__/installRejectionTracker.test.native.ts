/* eslint-disable @typescript-eslint/no-require-imports */
export {};

type RejectionTrackerOptions = {
  allRejections?: boolean;
  onUnhandled?: (id: number, rejection: unknown) => void;
  onHandled?: (id: number, rejection: unknown) => void;
};

const mockAppMetrics = {
  reportError: jest.fn(),
};

const originalHermesInternal = (globalThis as any).HermesInternal;

let enableTracker: jest.Mock<void, [RejectionTrackerOptions]>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  jest.doMock('expo-app-metrics', () => ({ __esModule: true, default: mockAppMetrics }));

  // @ts-expect-error: __DEV__ is a constant and we force it to false
  __DEV__ = false;
  enableTracker = jest.fn();
  (globalThis as any).HermesInternal = {
    hasPromise: () => true,
    enablePromiseRejectionTracker: enableTracker,
  };
});

afterEach(() => {
  // @ts-expect-error: __DEV__ is a constant and we restore it
  __DEV__ = true;
  (globalThis as any).HermesInternal = originalHermesInternal;
});

function loadModule() {
  return require('../installRejectionTracker') as typeof import('../installRejectionTracker');
}

/** Installs the tracker and returns the options it passed to Hermes. */
function installAndGetOptions(module: ReturnType<typeof loadModule>): RejectionTrackerOptions {
  module.installRejectionTracker();
  expect(enableTracker).toHaveBeenCalledTimes(1);
  return enableTracker.mock.calls.at(-1)?.[0] ?? {};
}

describe('installRejectionTracker', () => {
  it('tracks rejections of every value type', () => {
    const options = installAndGetOptions(loadModule());
    expect(options.allRejections).toBe(true);
  });

  it('reports an unhandled rejection as a non-fatal error with the unhandledRejection source', () => {
    const options = installAndGetOptions(loadModule());
    const error = new TypeError('boom');
    options.onUnhandled?.(0, error);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledWith({
      source: 'unhandledRejection',
      type: 'TypeError',
      message: 'boom',
      stacktrace: error.stack,
      isFatal: false,
    });
  });

  it('stops reporting when disabled', () => {
    const module = loadModule();
    const options = installAndGetOptions(module);
    module.setRejectionTrackerEnabled(false);
    options.onUnhandled?.(0, new Error('boom'));
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
  });

  it("keeps React Native's tracker in development", () => {
    // @ts-expect-error: __DEV__ is a constant and we force it to true
    __DEV__ = true;
    loadModule().installRejectionTracker();
    expect(enableTracker).not.toHaveBeenCalled();
  });

  it('does nothing when Hermes does not provide the global Promise', () => {
    (globalThis as any).HermesInternal.hasPromise = () => false;
    loadModule().installRejectionTracker();
    expect(enableTracker).not.toHaveBeenCalled();
  });
});
