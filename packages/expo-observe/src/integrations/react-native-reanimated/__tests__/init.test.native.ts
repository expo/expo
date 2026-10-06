/* eslint-disable @typescript-eslint/no-require-imports */
import type { LoadedReanimated } from '../reanimated';

const mockAppMetrics = {
  logEvent: jest.fn(),
  reportError: jest.fn(),
};

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: mockAppMetrics,
}));

type LogData = { level: number; message: string };

const WARN = 1;
const ERROR = 2;

const mockConfigureReanimatedLogger = jest.fn();
let mockLoaded: LoadedReanimated | null;

jest.mock('../reanimated', () => ({
  loadReanimated: () => mockLoaded,
}));

let warnSpy: jest.SpyInstance;

function loadInit() {
  return require('../init') as typeof import('../init');
}

function initAndGetOnLog(
  config: Parameters<ReturnType<typeof loadInit>['initReanimatedIntegration']>[0] = true
): (data: LogData) => void {
  loadInit().initReanimatedIntegration(config);
  const onLog = mockConfigureReanimatedLogger.mock.calls.at(-1)?.[1];
  if (typeof onLog !== 'function') {
    throw new Error('Expected configureReanimatedLogger to receive an onLog callback');
  }
  return onLog;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  mockLoaded = { version: '4.7.0', configureReanimatedLogger: mockConfigureReanimatedLogger };
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('initReanimatedIntegration', () => {
  it("configures Reanimated's logger with the defaults and an onLog callback", () => {
    loadInit().initReanimatedIntegration(true);

    expect(mockConfigureReanimatedLogger).toHaveBeenCalledTimes(1);
    expect(mockConfigureReanimatedLogger).toHaveBeenCalledWith({}, expect.any(Function));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('passes the level and strict settings from the integration config', () => {
    loadInit().initReanimatedIntegration({ level: ERROR, strict: false });

    expect(mockConfigureReanimatedLogger).toHaveBeenCalledWith(
      { level: ERROR, strict: false },
      expect.any(Function)
    );
  });

  it('applies the latest settings on a repeat configure call', () => {
    const { initReanimatedIntegration } = loadInit();
    initReanimatedIntegration({ strict: false });
    initReanimatedIntegration({ level: ERROR });

    expect(mockConfigureReanimatedLogger).toHaveBeenCalledTimes(2);
    expect(mockConfigureReanimatedLogger).toHaveBeenLastCalledWith(
      { level: ERROR },
      expect.any(Function)
    );
  });

  it('reports errors to Observe with the stack at the callback', () => {
    const onLog = initAndGetOnLog();

    onLog({ level: ERROR, message: '[Reanimated] Something failed' });

    expect(mockAppMetrics.reportError).toHaveBeenCalledWith({
      source: 'reportedByUser',
      type: 'reanimated.error',
      message: '[Reanimated] Something failed',
      stacktrace: expect.any(String),
      isFatal: false,
    });
    expect(mockAppMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('records warnings as Observe events', () => {
    const onLog = initAndGetOnLog();

    onLog({ level: WARN, message: '[Reanimated] Careful' });

    expect(mockAppMetrics.logEvent).toHaveBeenCalledWith('reanimated.warning', {
      displayName: 'Reanimated warning',
      body: '[Reanimated] Careful',
      severity: 'warn',
      attributes: { message: '[Reanimated] Careful' },
    });
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
  });

  it('does not print to the console, because Reanimated already does', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const onLog = initAndGetOnLog();

    onLog({ level: WARN, message: 'warning' });
    onLog({ level: ERROR, message: 'error' });

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('reports each distinct message once', () => {
    const onLog = initAndGetOnLog();

    onLog({ level: WARN, message: 'repeated' });
    onLog({ level: WARN, message: 'repeated' });
    onLog({ level: ERROR, message: 'repeated error' });
    onLog({ level: ERROR, message: 'repeated error' });

    expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
  });

  it('keeps reported messages across repeat configure calls', () => {
    initAndGetOnLog()({ level: WARN, message: 'repeated' });
    initAndGetOnLog()({ level: WARN, message: 'repeated' });

    expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(1);
  });

  it('stops reporting new warnings after 100 distinct ones in a window', () => {
    const onLog = initAndGetOnLog();

    for (let i = 0; i < 101; i++) {
      onLog({ level: WARN, message: `message ${i}` });
    }

    expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(100);
  });

  it('stops reporting new errors after 100 distinct ones in a window', () => {
    const onLog = initAndGetOnLog();

    for (let i = 0; i < 101; i++) {
      onLog({ level: ERROR, message: `message ${i}` });
    }

    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(100);
  });

  it('reports an error after the warning limit for the window is reached', () => {
    const onLog = initAndGetOnLog();

    for (let i = 0; i < 100; i++) {
      onLog({ level: WARN, message: `warning ${i}` });
    }
    onLog({ level: ERROR, message: 'error after warnings' });

    expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(100);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
  });

  it('reports a warning after the error limit for the window is reached', () => {
    const onLog = initAndGetOnLog();

    for (let i = 0; i < 100; i++) {
      onLog({ level: ERROR, message: `error ${i}` });
    }
    onLog({ level: WARN, message: 'warning after errors' });

    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(100);
    expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(1);
  });

  describe('reporting window', () => {
    const WINDOW_MS = 60_000;

    beforeEach(() => {
      jest.useFakeTimers({ now: 0 });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not report a repeated message again within the window', () => {
      const onLog = initAndGetOnLog();

      onLog({ level: ERROR, message: 'repeated' });
      jest.advanceTimersByTime(WINDOW_MS - 1);
      onLog({ level: ERROR, message: 'repeated' });

      expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
    });

    it('reports a repeated message again after the window passes', () => {
      const onLog = initAndGetOnLog();

      onLog({ level: WARN, message: 'repeated' });
      jest.advanceTimersByTime(WINDOW_MS);
      onLog({ level: WARN, message: 'repeated' });

      expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(2);
    });

    it('reports new messages after a surge leaves the window', () => {
      const onLog = initAndGetOnLog();

      for (let i = 0; i < 100; i++) {
        onLog({ level: ERROR, message: `surge ${i}` });
      }
      onLog({ level: ERROR, message: 'dropped during surge' });
      jest.advanceTimersByTime(WINDOW_MS);
      onLog({ level: ERROR, message: 'after surge' });

      expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(101);
      expect(mockAppMetrics.reportError).toHaveBeenLastCalledWith(
        expect.objectContaining({ message: 'after surge' })
      );
    });

    it('expires each message at the end of its own window', () => {
      const onLog = initAndGetOnLog();

      onLog({ level: WARN, message: 'first' });
      jest.advanceTimersByTime(WINDOW_MS / 2);
      onLog({ level: WARN, message: 'second' });
      jest.advanceTimersByTime(WINDOW_MS / 2);
      onLog({ level: WARN, message: 'first' });
      onLog({ level: WARN, message: 'second' });

      expect(mockAppMetrics.logEvent.mock.calls.map(([, options]) => options.body)).toEqual([
        'first',
        'second',
        'first',
      ]);
    });
  });

  it('tracks errors and warnings with the same message separately', () => {
    const onLog = initAndGetOnLog();

    onLog({ level: WARN, message: 'same message' });
    onLog({ level: ERROR, message: 'same message' });

    expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
  });

  it('truncates the message attribute but keeps the full body', () => {
    const message = 'x'.repeat(600);

    initAndGetOnLog()({ level: WARN, message });

    const [, options] = mockAppMetrics.logEvent.mock.calls[0];
    expect(options.body).toBe(message);
    expect(options.attributes.message).toHaveLength(500);
  });

  it('warns and does nothing when Reanimated is not installed', () => {
    mockLoaded = null;

    loadInit().initReanimatedIntegration(true);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('is not installed'));
  });

  it.each(['4.6.0', '4.6.3', '3.19.5'])(
    'warns and does nothing for Reanimated %s, which has no onLog option',
    (version) => {
      mockLoaded = { version, configureReanimatedLogger: mockConfigureReanimatedLogger };

      loadInit().initReanimatedIntegration(true);

      expect(mockConfigureReanimatedLogger).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(version));
    }
  );

  it.each(['4.7.0', '4.7.2', '4.8.0-nightly-20260922-79881d984', '5.0.0'])(
    'configures the logger for Reanimated %s',
    (version) => {
      mockLoaded = { version, configureReanimatedLogger: mockConfigureReanimatedLogger };

      loadInit().initReanimatedIntegration(true);

      expect(mockConfigureReanimatedLogger).toHaveBeenCalledTimes(1);
      expect(warnSpy).not.toHaveBeenCalled();
    }
  );
});
