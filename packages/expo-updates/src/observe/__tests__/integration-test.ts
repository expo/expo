import type { UpdatesLogEntry } from '../../Updates.types';
import { createExpoUpdatesObserveIntegration } from '../integration';
import type { ObserveReporter, ReportOptions } from '../types';

const NOW = 1_800_000_000_000;
const ONE_DAY_MS = 86_400_000;

type Report = {
  kind: 'error' | 'warning';
  report: Record<string, unknown>;
  options?: ReportOptions;
};

let reports: Report[];
let stored: Map<string, string>;
let reporter: ObserveReporter;
let readLogEntriesAsync: jest.Mock<Promise<UpdatesLogEntry[]>, [number]>;
let liveListeners: ((entry: UpdatesLogEntry) => void)[];
let removeSubscription: jest.Mock;
let warnSpy: jest.SpyInstance;

function entry(overrides: Partial<UpdatesLogEntry> = {}): UpdatesLogEntry {
  return {
    timestamp: NOW - 1000,
    message: 'Failed to load update',
    code: 'UpdateFailedToLoad',
    level: 'error',
    ...overrides,
  } as UpdatesLogEntry;
}

function errorRecoveryEntry(error: string, overrides: Partial<UpdatesLogEntry> = {}) {
  return entry({
    message: `ErrorRecovery: a JS exception was encountered: ${error}`,
    code: 'JSRuntimeError',
    key: 'errorRecovery.jsException',
    values: { error },
    ...overrides,
  } as Partial<UpdatesLogEntry>);
}

function createIntegration() {
  return createExpoUpdatesObserveIntegration({
    readLogEntriesAsync,
    addLogEntryListener: jest.fn((listener: (entry: UpdatesLogEntry) => void) => {
      liveListeners.push(listener);
      return {
        remove: removeSubscription.mockImplementation(() => {
          liveListeners = liveListeners.filter((item) => item !== listener);
        }),
      };
    }),
  });
}

async function configure(
  integration: ReturnType<typeof createIntegration>,
  entries: UpdatesLogEntry[],
  config: unknown = true
) {
  readLogEntriesAsync.mockResolvedValueOnce(entries);
  integration.configure(config, reporter);
  await integration.pendingRead;
}

async function run(entries: UpdatesLogEntry[], config: unknown = true) {
  const integration = createIntegration();
  await configure(integration, entries, config);
  return integration;
}

function emitLive(liveEntry: UpdatesLogEntry) {
  liveListeners.forEach((listener) => listener(liveEntry));
}

async function flushPromises() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

function storedCursor(): { timestamp: number; keys: string[] } | null {
  const value = stored.get('logCursor');
  return value ? JSON.parse(value) : null;
}

function errorMessages(): string[] {
  return reports.filter((r) => r.kind === 'error').map((r) => r.report.message as string);
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  reports = [];
  stored = new Map();
  liveListeners = [];
  removeSubscription = jest.fn();
  readLogEntriesAsync = jest.fn();
  reporter = {
    storage: {
      getItem: jest.fn(async (key: string) => stored.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string | null) => {
        if (value === null) {
          stored.delete(key);
        } else {
          stored.set(key, value);
        }
      }),
    },
    reportError: jest.fn((report, options) => {
      reports.push({ kind: 'error', report, options });
      return true;
    }),
    reportWarning: jest.fn((report, options) => {
      reports.push({ kind: 'warning', report, options });
      return true;
    }),
  };
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  warnSpy.mockRestore();
});

describe('reports', () => {
  test('reports error and fatal entries with the code in the message, filtered by the entry', async () => {
    const loadFailed = entry({
      message: 'Load failed',
      code: 'UpdateFailedToLoad',
    } as Partial<UpdatesLogEntry>);
    const initFailed = entry({
      message: 'Init failed',
      code: 'InitializationError',
      level: 'fatal',
    } as Partial<UpdatesLogEntry>);

    await run([loadFailed, initFailed]);

    expect(reports).toEqual([
      {
        kind: 'error',
        report: {
          type: 'updates.error',
          message: 'UpdateFailedToLoad: Load failed',
          code: 'UpdateFailedToLoad',
        },
        options: { filterValue: loadFailed },
      },
      {
        kind: 'error',
        report: {
          type: 'updates.error',
          message: 'InitializationError: Init failed',
          code: 'InitializationError',
        },
        options: { filterValue: initFailed },
      },
    ]);
  });

  test('reports error recovery entries with their own type, limit, and no filter', async () => {
    await run([errorRecoveryEntry('TypeError')]);

    expect(reports).toEqual([
      {
        kind: 'error',
        report: {
          type: 'updates.error_recovery',
          message: 'ErrorRecovery: a JS exception was encountered: TypeError',
          code: 'JSRuntimeError',
        },
        options: { skipFilter: true, limit: 'errorRecovery' },
      },
    ]);
  });

  test('does not report the entry that error recovery logs before it crashes the app', async () => {
    await run([
      entry({ key: 'errorRecovery.crash', code: 'JSRuntimeError' } as Partial<UpdatesLogEntry>),
    ]);

    expect(reports).toEqual([]);
  });

  test('reports a JSRuntimeError entry without the error recovery key as an error', async () => {
    await run([entry({ message: 'boom', code: 'JSRuntimeError' } as Partial<UpdatesLogEntry>)]);

    expect(errorMessages()).toEqual(['JSRuntimeError: boom']);
  });

  test('ignores warnings by default and entries below the warning level', async () => {
    await run([
      entry({ level: 'warn' } as Partial<UpdatesLogEntry>),
      entry({ level: 'info', message: 'info' } as Partial<UpdatesLogEntry>),
      entry({ level: 'debug', message: 'debug' } as Partial<UpdatesLogEntry>),
    ]);

    expect(reports).toEqual([]);
  });

  test('reports warnings as events when reportWarnings is set', async () => {
    const warning = entry({
      level: 'warn',
      message: 'Asset download failed',
      code: 'AssetsFailedToLoad',
      updateId: 'update-1',
      assetId: 'asset-1',
    } as Partial<UpdatesLogEntry>);

    await run([warning], { reportWarnings: true });

    expect(reports).toEqual([
      {
        kind: 'warning',
        report: {
          name: 'updates.warning',
          displayName: 'Updates warning',
          message: 'Asset download failed',
          code: 'AssetsFailedToLoad',
          attributes: { logTimestamp: warning.timestamp, updateId: 'update-1', assetId: 'asset-1' },
        },
        options: { filterValue: warning },
      },
    ]);
  });
});

describe('cursor', () => {
  test('reads one day of entries when there is no cursor', async () => {
    await run([]);

    expect(readLogEntriesAsync).toHaveBeenCalledWith(ONE_DAY_MS);
  });

  test('reads from the stored cursor, with one second of overlap', async () => {
    stored.set('logCursor', JSON.stringify({ timestamp: NOW - 60_000, keys: [] }));

    await run([]);

    expect(readLogEntriesAsync).toHaveBeenCalledWith(61_000);
  });

  test.each([
    ['older than one day', NOW - 2 * ONE_DAY_MS],
    ['in the future', NOW + 60_000],
  ])('reads one day of entries when the cursor is %s', async (_name, timestamp) => {
    stored.set('logCursor', JSON.stringify({ timestamp, keys: [] }));

    await run([]);

    expect(readLogEntriesAsync).toHaveBeenCalledWith(ONE_DAY_MS);
  });

  test('reads one day of entries when the stored cursor is malformed', async () => {
    stored.set('logCursor', 'not json');

    await run([]);

    expect(readLogEntriesAsync).toHaveBeenCalledWith(ONE_DAY_MS);
  });

  test('does not report entries again on the next start', async () => {
    const entries = [
      entry({ message: 'first' }),
      entry({ timestamp: NOW - 500, message: 'second' }),
    ];
    await run(entries);
    reports = [];

    await run(entries);

    expect(reports).toEqual([]);
  });

  test('reports a new entry from the same second as a reported entry', async () => {
    const first = entry({ timestamp: NOW - 1000, message: 'first' });
    await run([first]);
    reports = [];

    await run([first, entry({ timestamp: NOW - 1000, message: 'second' })]);

    expect(errorMessages()).toEqual(['UpdateFailedToLoad: second']);
  });

  test('reports entries in timestamp order and stores the newest timestamp', async () => {
    await run([
      entry({ timestamp: NOW - 500, message: 'newer' }),
      entry({ timestamp: NOW - 5000, message: 'older' }),
    ]);

    expect(errorMessages()).toEqual(['UpdateFailedToLoad: older', 'UpdateFailedToLoad: newer']);
    expect(storedCursor()?.timestamp).toBe(NOW - 500);
  });

  test('stores keys only for entries at the warning level or higher', async () => {
    await run([
      entry({ timestamp: NOW - 500, message: 'error' }),
      entry({ timestamp: NOW - 500, message: 'info', level: 'info' } as Partial<UpdatesLogEntry>),
    ]);

    expect(storedCursor()?.keys).toEqual([`${NOW - 500}|UpdateFailedToLoad|error`]);
  });

  test('runs one read at a time when configure is called again during a read', async () => {
    const integration = createIntegration();
    readLogEntriesAsync.mockResolvedValue([]);

    integration.configure(true, reporter);
    integration.configure(true, reporter);
    await integration.pendingRead;

    expect(readLogEntriesAsync).toHaveBeenCalledTimes(1);
  });

  test('warns and keeps the cursor when the log cannot be read', async () => {
    stored.set('logCursor', JSON.stringify({ timestamp: NOW - 60_000, keys: [] }));
    const integration = createIntegration();
    readLogEntriesAsync.mockRejectedValueOnce(new Error('disk'));

    integration.configure(true, reporter);
    await integration.pendingRead;

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('could not read the expo-updates log')
    );
    expect(storedCursor()?.timestamp).toBe(NOW - 60_000);
  });

  test('warns when the cursor cannot be stored', async () => {
    jest.mocked(reporter.storage.setItem).mockRejectedValueOnce(new Error('full'));

    await run([entry()]);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('could not store its log cursor'));
  });

  test('warns when the cursor cannot be loaded', async () => {
    jest.mocked(reporter.storage.getItem).mockRejectedValueOnce(new Error('locked'));

    await run([entry()]);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('could not read or store its log cursor')
    );
  });
});

describe('live entries', () => {
  test('subscribes to live entries before it reads the log', async () => {
    const integration = createIntegration();
    readLogEntriesAsync.mockImplementationOnce(async () => {
      expect(liveListeners).toHaveLength(1);
      return [];
    });

    await configure(integration, []);
    expect(readLogEntriesAsync).toHaveBeenCalled();
  });

  test('reports an entry logged after the read and moves the stored cursor', async () => {
    await run([]);

    emitLive(entry({ timestamp: NOW + 5000, message: 'live' }));
    await flushPromises();

    expect(errorMessages()).toEqual(['UpdateFailedToLoad: live']);
    expect(storedCursor()?.timestamp).toBe(NOW + 5000);
  });

  test('reports an entry once when it arrives live and in the read', async () => {
    const integration = createIntegration();
    const both = entry({ message: 'both' });
    readLogEntriesAsync.mockImplementationOnce(async () => {
      emitLive(both);
      return [both];
    });

    integration.configure(true, reporter);
    await integration.pendingRead;

    expect(errorMessages()).toEqual(['UpdateFailedToLoad: both']);
  });

  test('reports an entry once when it arrives in the read and then live', async () => {
    const both = entry({ message: 'both' });
    await run([both]);

    emitLive(both);

    expect(errorMessages()).toEqual(['UpdateFailedToLoad: both']);
  });

  test('does not move the cursor back when the read ends after a newer live entry', async () => {
    const integration = createIntegration();
    readLogEntriesAsync.mockImplementationOnce(async () => {
      emitLive(entry({ timestamp: NOW + 5000, message: 'live' }));
      return [entry({ timestamp: NOW - 5000, message: 'read' })];
    });

    integration.configure(true, reporter);
    await integration.pendingRead;
    await flushPromises();

    expect(storedCursor()?.timestamp).toBe(NOW + 5000);
  });

  test('holds a live entry that arrives during the read', async () => {
    const integration = createIntegration();
    jest.mocked(reporter.storage.getItem).mockReturnValueOnce(new Promise(() => {}));

    integration.configure(true, reporter);
    emitLive(entry({ timestamp: NOW + 5000, message: 'live' }));
    await flushPromises();

    expect(reports).toEqual([]);
    expect(reporter.storage.setItem).not.toHaveBeenCalled();
  });

  test('reports a live entry that arrived during the read after the read', async () => {
    const integration = createIntegration();
    readLogEntriesAsync.mockImplementationOnce(async () => {
      emitLive(entry({ timestamp: NOW + 5000, message: 'live' }));
      return [entry({ message: 'read' })];
    });

    integration.configure(true, reporter);
    await integration.pendingRead;
    await integration.pendingLiveReports;

    expect(errorMessages()).toEqual(['UpdateFailedToLoad: read', 'UpdateFailedToLoad: live']);
    expect(storedCursor()?.timestamp).toBe(NOW + 5000);
  });

  test('reports a live entry only after its cursor is stored', async () => {
    const integration = await run([]);
    let finishWrite: () => void = () => {};
    jest
      .mocked(reporter.storage.setItem)
      .mockReturnValueOnce(new Promise<void>((resolve) => (finishWrite = resolve)));

    emitLive(entry({ timestamp: NOW + 5000, message: 'live' }));
    await flushPromises();
    expect(reporter.storage.setItem).toHaveBeenCalledTimes(1);
    expect(reports).toEqual([]);

    finishWrite();
    await integration.pendingLiveReports;
    expect(errorMessages()).toEqual(['UpdateFailedToLoad: live']);
  });

  test('leaves a live entry whose cursor write fails, and later live entries, to the next launch', async () => {
    const integration = await run([]);
    jest.mocked(reporter.storage.setItem).mockRejectedValueOnce(new Error('disk full'));

    emitLive(entry({ timestamp: NOW + 5000, message: 'first' }));
    await integration.pendingLiveReports;
    emitLive(entry({ timestamp: NOW + 6000, message: 'second' }));
    await integration.pendingLiveReports;

    expect(reports).toEqual([]);
    expect(reporter.storage.setItem).toHaveBeenCalledTimes(1);
    expect(storedCursor()).toBeNull();
  });

  test('does not store a later live entry when an earlier write fails after it arrives', async () => {
    const integration = await run([]);
    let failWrite: (error: Error) => void = () => {};
    jest
      .mocked(reporter.storage.setItem)
      .mockReturnValueOnce(new Promise<void>((_, reject) => (failWrite = reject)));

    emitLive(entry({ timestamp: NOW + 5000, message: 'first' }));
    emitLive(entry({ timestamp: NOW + 5500, message: 'second' }));
    await flushPromises();
    failWrite(new Error('disk full'));
    await integration.pendingLiveReports;

    expect(reports).toEqual([]);
    expect(reporter.storage.setItem).toHaveBeenCalledTimes(1);
    expect(storedCursor()).toBeNull();
  });

  test('reads a live entry whose write failed again when configure is called again', async () => {
    const failed = entry({ timestamp: NOW + 5000, message: 'failed' });
    const integration = await run([]);
    jest.mocked(reporter.storage.setItem).mockRejectedValueOnce(new Error('disk full'));

    emitLive(failed);
    await integration.pendingLiveReports;
    expect(reports).toEqual([]);
    expect(storedCursor()).toBeNull();

    jest.setSystemTime(NOW + 10_000);
    readLogEntriesAsync.mockResolvedValueOnce([failed]);
    integration.configure(true, reporter);
    await integration.pendingRead;

    expect(readLogEntriesAsync).toHaveBeenLastCalledWith(ONE_DAY_MS);
    expect(errorMessages()).toEqual(['UpdateFailedToLoad: failed']);
    expect(storedCursor()?.timestamp).toBe(NOW + 5000);
  });

  test('reports a live entry once when configure is called again during its write', async () => {
    const live = entry({ timestamp: NOW + 5000, message: 'live' });
    const integration = await run([]);
    let finishWrite: () => void = () => {};
    jest.mocked(reporter.storage.setItem).mockImplementationOnce(async (key, value) => {
      await new Promise<void>((resolve) => (finishWrite = resolve));
      stored.set(key, value!);
    });

    emitLive(live);
    await flushPromises();
    readLogEntriesAsync.mockResolvedValueOnce([live]);
    integration.configure(true, reporter);
    finishWrite();
    await integration.pendingRead;

    expect(errorMessages()).toEqual(['UpdateFailedToLoad: live']);
  });

  test('leaves a live error recovery entry, and later live entries, to the next launch', async () => {
    const integration = await run([entry({ message: 'read' })]);
    const cursorAfterRead = storedCursor();
    jest.mocked(reporter.storage.setItem).mockClear();

    emitLive(errorRecoveryEntry('TypeError', { timestamp: NOW + 5000 }));
    emitLive(entry({ timestamp: NOW + 6000, message: 'after' }));
    await integration.pendingLiveReports;

    expect(errorMessages()).toEqual(['UpdateFailedToLoad: read']);
    expect(reporter.storage.setItem).not.toHaveBeenCalled();
    expect(storedCursor()).toEqual(cursorAfterRead);
  });

  test('reports the error recovery entry on the next launch', async () => {
    const recovery = errorRecoveryEntry('TypeError', { timestamp: NOW + 5000 });
    const first = await run([]);
    emitLive(recovery);
    await first.pendingLiveReports;
    expect(reports).toEqual([]);

    jest.setSystemTime(NOW + 10_000);
    liveListeners = [];
    await run([recovery]);

    expect(reports.map((r) => r.report.type)).toEqual(['updates.error_recovery']);
  });

  test('leaves live entries that arrive during a failed read to the next launch', async () => {
    const integration = createIntegration();
    readLogEntriesAsync.mockImplementationOnce(async () => {
      emitLive(entry({ timestamp: NOW + 5000, message: 'live' }));
      throw new Error('read failed');
    });

    integration.configure(true, reporter);
    await integration.pendingRead;
    emitLive(entry({ timestamp: NOW + 6000, message: 'after' }));
    await integration.pendingLiveReports;

    expect(reports).toEqual([]);
    expect(storedCursor()).toBeNull();
  });

  test('holds live entries again during the read after it is disabled and enabled', async () => {
    const integration = await run([]);
    integration.disable!();
    jest.mocked(reporter.storage.getItem).mockReturnValueOnce(new Promise(() => {}));
    jest.mocked(reporter.storage.setItem).mockClear();

    integration.configure(true, reporter);
    emitLive(entry({ timestamp: NOW + 5000, message: 'live' }));
    await flushPromises();

    expect(reports).toEqual([]);
    expect(reporter.storage.setItem).not.toHaveBeenCalled();
  });

  test('stores the cursor of a live entry once the read finishes', async () => {
    const integration = createIntegration();
    let finishRead: (entries: UpdatesLogEntry[]) => void = () => {};
    readLogEntriesAsync.mockReturnValueOnce(new Promise((resolve) => (finishRead = resolve)));

    integration.configure(true, reporter);
    await flushPromises();
    emitLive(entry({ timestamp: NOW + 5000, message: 'live' }));
    await flushPromises();
    expect(reporter.storage.setItem).not.toHaveBeenCalled();

    finishRead([]);
    await integration.pendingRead;

    expect(storedCursor()?.timestamp).toBe(NOW + 5000);
  });

  test('subscribes once across repeated configure calls', async () => {
    const integration = createIntegration();
    await configure(integration, []);
    await configure(integration, []);

    expect(liveListeners).toHaveLength(1);
  });

  test('stops reports and removes its subscription when disabled', async () => {
    const integration = await run([]);

    integration.disable!();
    emitLive(entry({ message: 'after disable' }));

    expect(removeSubscription).toHaveBeenCalledTimes(1);
    expect(reports).toEqual([]);
  });

  test('subscribes again after it is disabled and enabled', async () => {
    const integration = await run([]);
    integration.disable!();

    await configure(integration, []);
    emitLive(entry({ timestamp: NOW + 5000, message: 'again' }));
    await integration.pendingLiveReports;

    expect(liveListeners).toHaveLength(1);
    expect(errorMessages()).toEqual(['UpdateFailedToLoad: again']);
  });

  test('does not report or move the cursor for a read that ends after it is disabled', async () => {
    const integration = createIntegration();
    readLogEntriesAsync.mockImplementationOnce(async () => {
      integration.disable!();
      return [entry()];
    });

    integration.configure(true, reporter);
    await integration.pendingRead;

    expect(reports).toEqual([]);
    expect(storedCursor()).toBeNull();
  });
});

describe('reporter compatibility', () => {
  test('warns and reports nothing when the reporter has no storage', async () => {
    const integration = createIntegration();
    const { storage: _storage, ...olderReporter } = reporter;

    integration.configure(true, olderReporter as ObserveReporter);
    emitLive(entry());

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('needs a newer version of expo-observe')
    );
    expect(liveListeners).toHaveLength(0);
    expect(readLogEntriesAsync).not.toHaveBeenCalled();
    expect(reports).toEqual([]);
  });
});
