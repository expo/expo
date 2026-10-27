/* eslint-disable @typescript-eslint/no-require-imports */
import type { ExpoUpdatesLogCursorStore } from '../init';
import type { LoadedUpdates, UpdatesLogEntry } from '../updates';

const mockAppMetrics = {
  logEvent: jest.fn(),
  reportError: jest.fn(),
};

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: mockAppMetrics,
}));

const mockReadLogEntriesAsync = jest.fn<Promise<UpdatesLogEntry[]>, [number]>();
let mockLoaded: LoadedUpdates | null;

jest.mock('../updates', () => ({
  loadUpdates: () => mockLoaded,
}));

const NOW = 1_800_000_000_000;
const ONE_DAY_MS = 86_400_000;
const WINDOW_MS = 15 * 60_000;

let storedCursor: string | null;
let cursorStore: ExpoUpdatesLogCursorStore;
let warnSpy: jest.SpyInstance;

function loadInit() {
  return require('../init') as typeof import('../init');
}

function entry(overrides: Partial<UpdatesLogEntry> = {}): UpdatesLogEntry {
  return {
    timestamp: NOW - 1000,
    message: 'Failed to load update',
    code: 'UpdateFailedToLoad',
    level: 'error',
    ...overrides,
  };
}

async function runIntegration(
  entries: UpdatesLogEntry[],
  config: Parameters<ReturnType<typeof loadInit>['initExpoUpdatesIntegration']>[0] = true
) {
  mockReadLogEntriesAsync.mockResolvedValueOnce(entries);
  await loadInit().initExpoUpdatesIntegration(config, cursorStore);
}

function reportedErrorTypes(): string[] {
  return mockAppMetrics.reportError.mock.calls.map(([report]) => report.type);
}

function reportedErrorMessages(): string[] {
  return mockAppMetrics.reportError.mock.calls.map(([report]) => report.message);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockReadLogEntriesAsync.mockReset();
  jest.resetModules();
  jest.useFakeTimers({ now: NOW });
  mockLoaded = { readLogEntriesAsync: mockReadLogEntriesAsync };
  storedCursor = null;
  cursorStore = {
    getExpoUpdatesLogCursor: jest.fn(async () => storedCursor),
    setExpoUpdatesLogCursor: jest.fn(async (cursor: string) => {
      storedCursor = cursor;
    }),
  };
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  warnSpy.mockRestore();
});

describe('initExpoUpdatesIntegration', () => {
  it('reports error and fatal entries as integration errors with the code in the message', async () => {
    await runIntegration([
      entry({ message: 'Load failed', code: 'UpdateFailedToLoad', level: 'error' }),
      entry({ message: 'Init failed', code: 'InitializationError', level: 'fatal' }),
    ]);

    expect(mockAppMetrics.reportError).toHaveBeenCalledWith({
      source: 'integration',
      type: 'updates.error',
      message: 'UpdateFailedToLoad: Load failed',
      stacktrace: undefined,
      isFatal: false,
    });
    expect(reportedErrorTypes()).toEqual(['updates.error', 'updates.error']);
    expect(reportedErrorMessages()).toEqual([
      'UpdateFailedToLoad: Load failed',
      'InitializationError: Init failed',
    ]);
  });

  it('reports error recovery entries with their own type', async () => {
    await runIntegration([
      entry({
        message: 'ErrorRecovery fatal exception: Fatal error: TypeError',
        code: 'JSRuntimeError',
      }),
      entry({ message: 'ErrorRecovery: exception encountered: boom', code: 'JSRuntimeError' }),
    ]);

    expect(reportedErrorTypes()).toEqual(['updates.error_recovery', 'updates.error_recovery']);
    expect(reportedErrorMessages()).toEqual([
      'ErrorRecovery fatal exception: Fatal error: TypeError',
      'ErrorRecovery: exception encountered: boom',
    ]);
  });

  it('does not report the entry that error recovery logs before it crashes the app', async () => {
    await runIntegration([
      entry({
        message: 'ErrorRecovery fatal exception: Fatal error: boom',
        code: 'JSRuntimeError',
      }),
      entry({ message: 'ErrorRecovery: could not recover from error, crashing' }),
      entry({
        message: 'UpdatesErrorRecovery: could not recover from error, crashing: boom',
        code: 'Unknown',
      }),
    ]);

    expect(reportedErrorTypes()).toEqual(['updates.error_recovery']);
  });

  it('reports a JSRuntimeError entry without the error recovery prefix as an error', async () => {
    await runIntegration([entry({ message: 'Other runtime error', code: 'JSRuntimeError' })]);

    expect(reportedErrorTypes()).toEqual(['updates.error']);
    expect(reportedErrorMessages()).toEqual(['JSRuntimeError: Other runtime error']);
  });

  it('ignores warnings by default and entries below the warning level', async () => {
    await runIntegration([
      entry({ level: 'warn', message: 'warning' }),
      entry({ level: 'info', message: 'info' }),
      entry({ level: 'debug', message: 'debug' }),
    ]);

    expect(mockAppMetrics.logEvent).not.toHaveBeenCalled();
    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
  });

  it('records warnings as events when reportWarnings is set', async () => {
    await runIntegration(
      [
        entry({
          timestamp: NOW - 5000,
          level: 'warn',
          message: 'Asset download failed',
          code: 'AssetsFailedToLoad',
          updateId: 'update-1',
          assetId: 'asset-1',
        }),
      ],
      { reportWarnings: true }
    );

    expect(mockAppMetrics.logEvent).toHaveBeenCalledWith('updates.warning', {
      displayName: 'Updates warning',
      body: 'Asset download failed',
      severity: 'warn',
      attributes: {
        message: 'Asset download failed',
        code: 'AssetsFailedToLoad',
        logTimestamp: NOW - 5000,
        updateId: 'update-1',
        assetId: 'asset-1',
      },
    });
  });

  it('reads one day of entries when there is no cursor', async () => {
    await runIntegration([]);

    expect(mockReadLogEntriesAsync).toHaveBeenCalledWith(ONE_DAY_MS);
  });

  it('reads from the stored cursor, with one second of overlap', async () => {
    storedCursor = JSON.stringify({ timestamp: NOW - 60_000, keys: [] });

    await runIntegration([]);

    expect(mockReadLogEntriesAsync).toHaveBeenCalledWith(61_000);
  });

  it('reads one day of entries when the cursor is older than one day or in the future', async () => {
    storedCursor = JSON.stringify({ timestamp: NOW - 2 * ONE_DAY_MS, keys: [] });
    await runIntegration([]);
    storedCursor = JSON.stringify({ timestamp: NOW + 60_000, keys: [] });
    await runIntegration([]);
    storedCursor = 'not json';
    await runIntegration([]);

    expect(mockReadLogEntriesAsync.mock.calls).toEqual([[ONE_DAY_MS], [ONE_DAY_MS], [ONE_DAY_MS]]);
  });

  it('does not report entries again on the next start', async () => {
    const entries = [
      entry({ timestamp: NOW - 3000, message: 'first' }),
      entry({ timestamp: NOW - 2000, message: 'second' }),
    ];
    await runIntegration(entries);

    jest.setSystemTime(NOW + WINDOW_MS);
    jest.resetModules();
    await runIntegration([...entries, entry({ timestamp: NOW + 1000, message: 'third' })]);

    expect(reportedErrorMessages()).toEqual([
      'UpdateFailedToLoad: first',
      'UpdateFailedToLoad: second',
      'UpdateFailedToLoad: third',
    ]);
  });

  it('reports a new entry with the same second as a reported entry', async () => {
    // Before millisecond timestamps, iOS wrote entries of the same second with the same timestamp.
    await runIntegration([entry({ timestamp: NOW - 1000, message: 'first' })]);

    jest.setSystemTime(NOW + WINDOW_MS);
    jest.resetModules();
    await runIntegration([
      entry({ timestamp: NOW - 1000, message: 'first' }),
      entry({ timestamp: NOW - 1000, message: 'second' }),
    ]);

    expect(reportedErrorMessages()).toEqual([
      'UpdateFailedToLoad: first',
      'UpdateFailedToLoad: second',
    ]);
  });

  it('reports entries in timestamp order and stores the newest timestamp', async () => {
    await runIntegration([
      entry({ timestamp: NOW - 1000, message: 'newer' }),
      entry({ timestamp: NOW - 9000, message: 'older' }),
    ]);

    expect(reportedErrorMessages()).toEqual([
      'UpdateFailedToLoad: older',
      'UpdateFailedToLoad: newer',
    ]);
    expect(JSON.parse(storedCursor!)).toEqual({
      timestamp: NOW - 1000,
      keys: [`${NOW - 1000}|UpdateFailedToLoad|newer`],
    });
  });

  it('stores keys only for entries at the warning level or higher', async () => {
    await runIntegration([
      entry({ timestamp: NOW - 1500, level: 'info', message: 'info' }),
      entry({ timestamp: NOW - 1200, level: 'warn', message: 'warning' }),
      entry({ timestamp: NOW - 1000, level: 'debug', message: 'debug' }),
    ]);

    expect(JSON.parse(storedCursor!)).toEqual({
      timestamp: NOW - 1000,
      keys: [`${NOW - 1200}|UpdateFailedToLoad|warning`],
    });
  });

  it('runs one read at a time when configure is called again during a read', async () => {
    let resolveRead: (entries: UpdatesLogEntry[]) => void = () => {};
    mockReadLogEntriesAsync.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRead = resolve;
      })
    );
    const { initExpoUpdatesIntegration } = loadInit();

    const first = initExpoUpdatesIntegration(true, cursorStore);
    const second = initExpoUpdatesIntegration(true, cursorStore);
    resolveRead([entry()]);
    await Promise.all([first, second]);

    expect(mockReadLogEntriesAsync).toHaveBeenCalledTimes(1);
    expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
  });

  it('warns and keeps the cursor when the log cannot be read', async () => {
    storedCursor = JSON.stringify({ timestamp: NOW - 60_000, keys: [] });
    mockReadLogEntriesAsync.mockRejectedValueOnce(new Error('read failed'));

    await loadInit().initExpoUpdatesIntegration(true, cursorStore);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('read failed'));
    expect(cursorStore.setExpoUpdatesLogCursor).not.toHaveBeenCalled();
  });

  it.each(['getExpoUpdatesLogCursor', 'setExpoUpdatesLogCursor'] as const)(
    'warns and does not reject when %s fails',
    async (method) => {
      jest.mocked(cursorStore[method]).mockRejectedValueOnce(new Error('storage failed'));
      mockReadLogEntriesAsync.mockResolvedValueOnce([entry()]);

      await expect(
        loadInit().initExpoUpdatesIntegration(true, cursorStore)
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('storage failed'));
    }
  );

  describe('filters', () => {
    it('drops entries with an ignored code but still moves the cursor past them', async () => {
      await runIntegration(
        [
          entry({ timestamp: NOW - 2000, code: 'Unknown', message: 'offline' }),
          entry({ timestamp: NOW - 1000, code: 'UpdateFailedToLoad', message: 'load failed' }),
        ],
        { ignoredCodes: ['Unknown'] }
      );

      expect(reportedErrorMessages()).toEqual(['UpdateFailedToLoad: load failed']);
      expect(JSON.parse(storedCursor!).timestamp).toBe(NOW - 1000);
    });

    it('drops entries for which shouldReport returns false', async () => {
      const shouldReport = jest.fn(
        (logEntry: UpdatesLogEntry) => !logEntry.message.includes('offline')
      );

      await runIntegration(
        [entry({ message: 'The device is offline' }), entry({ message: 'load failed' })],
        { shouldReport }
      );

      expect(shouldReport).toHaveBeenCalledTimes(2);
      expect(reportedErrorMessages()).toEqual(['UpdateFailedToLoad: load failed']);
    });

    it('applies the filters to warnings', async () => {
      await runIntegration(
        [entry({ level: 'warn', code: 'AssetsFailedToLoad', message: 'patch fallback' })],
        { reportWarnings: true, ignoredCodes: ['AssetsFailedToLoad'] }
      );

      expect(mockAppMetrics.logEvent).not.toHaveBeenCalled();
    });

    it('always reports error recovery entries', async () => {
      await runIntegration(
        [entry({ message: 'ErrorRecovery: exception encountered: boom', code: 'JSRuntimeError' })],
        { ignoredCodes: ['JSRuntimeError'], shouldReport: () => false }
      );

      expect(reportedErrorTypes()).toEqual(['updates.error_recovery']);
    });

    it('reports the entry and warns once when shouldReport throws', async () => {
      await runIntegration([entry({ message: 'first' }), entry({ message: 'second' })], {
        shouldReport: () => {
          throw new Error('bad filter');
        },
      });

      expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(2);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('bad filter'));
    });
  });

  describe('limits', () => {
    it('reports a repeated message once in a window and again after it', async () => {
      await runIntegration([
        entry({ timestamp: NOW - 3000, message: 'repeated' }),
        entry({ timestamp: NOW - 2000, message: 'repeated' }),
      ]);
      expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(WINDOW_MS);
      await runIntegration([entry({ timestamp: NOW + WINDOW_MS - 1000, message: 'repeated' })]);

      expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(2);
    });

    it('stops reporting new errors after 20 distinct ones in a window', async () => {
      await runIntegration(
        Array.from({ length: 21 }, (_, i) =>
          entry({ timestamp: NOW - 30_000 + i, message: `e${i}` })
        )
      );

      expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(20);
    });

    it('limits warnings separately from errors', async () => {
      const warnings = Array.from({ length: 20 }, (_, i) =>
        entry({ timestamp: NOW - 30_000 + i, level: 'warn', message: `w${i}` })
      );
      await runIntegration([...warnings, entry({ message: 'error after warnings' })], {
        reportWarnings: true,
      });

      expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(20);
      expect(mockAppMetrics.reportError).toHaveBeenCalledTimes(1);
    });

    it('caps the deduplicated text and the warning attribute at 500 characters', async () => {
      const prefix = 'x'.repeat(500);
      await runIntegration(
        [
          entry({ timestamp: NOW - 2000, level: 'warn', message: `${prefix} first` }),
          entry({ timestamp: NOW - 1000, level: 'warn', message: `${prefix} second` }),
        ],
        { reportWarnings: true }
      );

      expect(mockAppMetrics.logEvent).toHaveBeenCalledTimes(1);
      const [, options] = mockAppMetrics.logEvent.mock.calls[0];
      expect(options.body).toBe(`${prefix} first`);
      expect(options.attributes.message).toHaveLength(500);
    });
  });

  it('warns and does nothing when expo-updates is not installed', async () => {
    mockLoaded = null;

    await loadInit().initExpoUpdatesIntegration(true, cursorStore);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('is not installed'));
    expect(cursorStore.getExpoUpdatesLogCursor).not.toHaveBeenCalled();
  });

  it('does not report or move the cursor after the integration is disabled', async () => {
    let resolveRead: (entries: UpdatesLogEntry[]) => void = () => {};
    mockReadLogEntriesAsync.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRead = resolve;
      })
    );
    const { initExpoUpdatesIntegration, disableExpoUpdatesIntegration } = loadInit();

    const running = initExpoUpdatesIntegration(true, cursorStore);
    disableExpoUpdatesIntegration();
    resolveRead([entry()]);
    await running;

    expect(mockAppMetrics.reportError).not.toHaveBeenCalled();
    expect(cursorStore.setExpoUpdatesLogCursor).not.toHaveBeenCalled();
  });
});
