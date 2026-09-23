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
type LoggerConfig = {
  logFunction: (data: LogData) => void;
  level: number;
  strict: boolean;
  onLog?: (data: LogData) => void;
};

const reanimatedGlobal = globalThis as { __reanimatedLoggerConfig?: LoggerConfig };

const WARN = 1;
const ERROR = 2;

let mockLoaded: LoadedReanimated | null;
const mockRunOnUISync = jest.fn();
const mockScheduleOnRN = jest.fn(<A extends unknown[]>(fn: (...args: A) => void, ...args: A) =>
  fn(...args)
);

jest.mock('../reanimated', () => ({
  loadReanimated: () => mockLoaded,
}));

let warnSpy: jest.SpyInstance;
let errorSpy: jest.SpyInstance;

function loggerConfig(): LoggerConfig {
  const config = reanimatedGlobal.__reanimatedLoggerConfig;
  if (!config) {
    throw new Error('Expected a Reanimated logger config to be installed');
  }
  return config;
}

function initReanimatedIntegration() {
  const init = require('../init') as typeof import('../init');
  init.initReanimatedIntegration();
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  reanimatedGlobal.__reanimatedLoggerConfig = undefined;
  mockLoaded = {
    version: '4.6.0',
    worklets: { runOnUISync: mockRunOnUISync, scheduleOnRN: mockScheduleOnRN },
  };
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe('initReanimatedIntegration', () => {
  it('replaces the log function and keeps the configured level, strict mode and other fields', () => {
    const originalLogFunction = jest.fn();
    const onLog = jest.fn();
    reanimatedGlobal.__reanimatedLoggerConfig = {
      logFunction: originalLogFunction,
      level: ERROR,
      strict: false,
      onLog,
    };

    initReanimatedIntegration();

    expect(loggerConfig()).toEqual({
      logFunction: expect.any(Function),
      level: ERROR,
      strict: false,
      onLog,
    });
    expect(loggerConfig().logFunction).not.toBe(originalLogFunction);
  });

  it("uses Reanimated's defaults when no logger config exists yet", () => {
    initReanimatedIntegration();

    expect(loggerConfig()).toEqual({
      logFunction: expect.any(Function),
      level: WARN,
      strict: true,
    });
  });

  it('installs the same log function on the UI runtime, keeping the UI runtime config', () => {
    initReanimatedIntegration();
    const rnLogFunction = loggerConfig().logFunction;

    expect(mockRunOnUISync).toHaveBeenCalledTimes(1);
    const [installOnUIRuntime, ...args] = mockRunOnUISync.mock.calls[0];

    // Simulate the separate UI runtime global.
    reanimatedGlobal.__reanimatedLoggerConfig = {
      logFunction: jest.fn(),
      level: ERROR,
      strict: false,
    };
    installOnUIRuntime(...args);

    expect(loggerConfig()).toEqual({ logFunction: rnLogFunction, level: ERROR, strict: false });
  });

  it('logs errors to the console and reports them to Observe with the log-site stack', () => {
    initReanimatedIntegration();

    loggerConfig().logFunction({ level: ERROR, message: '[Reanimated] Something failed' });

    expect(errorSpy).toHaveBeenCalledWith('[Reanimated] Something failed');
    expect(mockAppMetrics.reportError).toHaveBeenCalledWith({
      source: 'reportedByUser',
      type: 'reanimated.error',
      message: '[Reanimated] Something failed',
      stacktrace: expect.any(String),
      isFatal: false,
    });
    expect(mockAppMetrics.logEvent).not.toHaveBeenCalled();
  });

  it('logs warnings to the console and records them as Observe events', () => {
    initReanimatedIntegration();

    loggerConfig().logFunction({ level: WARN, message: '[Reanimated] Careful' });

    expect(warnSpy).toHaveBeenCalledWith('[Reanimated] Careful');
    expect(mockAppMetrics.logEvent).toHaveBeenCalledWith('reanimated.warning', {
      displayName: 'Reanimated warning',
      body: '[Reanimated] Careful',
      severity: 'warn',
      attributes: { message: '[Reanimated] Careful' },
    });
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
  });

  it('reports each distinct message once but keeps logging it to the console', () => {
    initReanimatedIntegration();
    const { logFunction } = loggerConfig();

    logFunction({ level: WARN, message: 'repeated' });
    logFunction({ level: WARN, message: 'repeated' });
    logFunction({ level: ERROR, message: 'repeated error' });
    logFunction({ level: ERROR, message: 'repeated error' });

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
  });

  it('stops reporting new messages after 100 distinct ones', () => {
    initReanimatedIntegration();
    const { logFunction } = loggerConfig();

    for (let i = 0; i < 101; i++) {
      logFunction({ level: WARN, message: `message ${i}` });
    }

    expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(100);
    expect(warnSpy).toHaveBeenCalledTimes(101);
  });

  it('truncates the message attribute but keeps the full body', () => {
    initReanimatedIntegration();
    const message = 'x'.repeat(600);

    loggerConfig().logFunction({ level: WARN, message });

    const [, options] = mockAppMetrics.logEvent.mock.calls[0];
    expect(options.body).toBe(message);
    expect(options.attributes.message).toHaveLength(500);
  });

  it('installs only once across repeated configure calls', () => {
    initReanimatedIntegration();
    const { logFunction } = loggerConfig();
    initReanimatedIntegration();

    expect(mockRunOnUISync).toHaveBeenCalledTimes(1);
    expect(loggerConfig().logFunction).toBe(logFunction);
  });

  it('warns and does nothing when Reanimated or Worklets is not installed', () => {
    mockLoaded = null;

    initReanimatedIntegration();

    expect(reanimatedGlobal.__reanimatedLoggerConfig).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('is not installed'));
  });

  it.each(['4.5.0', '4.8.0', '5.0.0'])(
    'warns and does nothing for an unverified Reanimated version (%s)',
    (version) => {
      mockLoaded = { ...mockLoaded!, version };

      initReanimatedIntegration();

      expect(reanimatedGlobal.__reanimatedLoggerConfig).toBeUndefined();
      expect(mockRunOnUISync).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(version));
    }
  );

  it.each(['4.6.0', '4.6.3', '4.7.0', '4.7.2'])('installs for Reanimated %s', (version) => {
    mockLoaded = { ...mockLoaded!, version };

    initReanimatedIntegration();

    expect(loggerConfig().logFunction).toEqual(expect.any(Function));
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
