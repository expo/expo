import type { EventSubscription } from 'expo-modules-core';

import type { UpdatesLogEntry } from '../Updates.types';
import type { ExpoUpdatesIntegrationConfig, ObserveIntegration, ObserveReporter } from './types';

const ERROR_TYPE = 'updates.error';
const ERROR_RECOVERY_TYPE = 'updates.error_recovery';
const WARNING_EVENT = 'updates.warning';
const ERROR_RECOVERY_LIMIT = 'errorRecovery';
const CURSOR_KEY = 'logCursor';

// The key of the entry that expo-updates logs for a JS error that error recovery handles.
const ERROR_RECOVERY_KEY = 'errorRecovery.jsException';
// When error recovery cannot recover, it logs an entry with this key just before the app crashes.
// Observe already reports the crash, and the error that started error recovery is reported as
// `updates.error_recovery`, so this entry adds no error of its own.
const ERROR_RECOVERY_CRASH_KEY = 'errorRecovery.crash';

// expo-updates keeps log entries for one day and reads back at most one day.
const MAX_LOOKBACK_MS = 86_400_000;
// Before expo-updates wrote millisecond timestamps, iOS truncated them to whole seconds, so the
// read starts one second before the cursor and the keys of that second remove the overlap.
const CURSOR_OVERLAP_MS = 1000;

// The levels that the integration can report. The cursor stores keys only for these entries,
// because an entry at a lower level that is read again is never reported.
const REPORTABLE_LEVELS: ReadonlySet<string> = new Set(['warn', 'error', 'fatal']);

// Keys of the entries handled in this JS session, so an entry that arrives both live and in the
// read is reported once. Only the newest keys are kept.
const MAX_HANDLED_KEYS = 1000;

/**
 * The `expo-updates` functions that the integration uses.
 */
export type ExpoUpdatesLog = {
  readLogEntriesAsync(maxAge: number): Promise<UpdatesLogEntry[]>;
  addLogEntryListener(listener: (entry: UpdatesLogEntry) => void): EventSubscription;
};

/**
 * The timestamp of the newest log entry that was read, and the keys of the entries in the second
 * before it.
 */
type LogCursor = { timestamp: number; keys: string[] };

function entryKey(entry: UpdatesLogEntry): string {
  return `${entry.timestamp}|${entry.code}|${entry.message}`;
}

function keyTimestamp(key: string): number {
  return Number(key.slice(0, key.indexOf('|')));
}

function parseCursor(value: string | null, now: number): LogCursor | null {
  if (value === null) {
    return null;
  }
  try {
    const cursor = JSON.parse(value) as LogCursor;
    if (typeof cursor.timestamp !== 'number' || !Array.isArray(cursor.keys)) {
      return null;
    }
    // A cursor in the future comes from a device clock that moved back, and it would hide every
    // new entry.
    return cursor.timestamp > now ? null : cursor;
  } catch {
    return null;
  }
}

function lookbackFrom(cursor: LogCursor | null, now: number): number {
  if (!cursor) {
    return MAX_LOOKBACK_MS;
  }
  const lookback = now - cursor.timestamp + CURSOR_OVERLAP_MS;
  return Math.min(Math.max(lookback, CURSOR_OVERLAP_MS), MAX_LOOKBACK_MS);
}

/**
 * Combines two cursors: the newer timestamp, and the keys of both that are in the second before it.
 * So the cursor never moves back, for example when a read ends after a newer live entry.
 */
function mergeCursors(a: LogCursor | null, b: LogCursor | null): LogCursor | null {
  if (!a || !b) {
    return a ?? b;
  }
  const timestamp = Math.max(a.timestamp, b.timestamp);
  const keys = [...a.keys, ...b.keys].filter(
    (key) => keyTimestamp(key) >= timestamp - CURSOR_OVERLAP_MS
  );
  return { timestamp, keys: [...new Set(keys)] };
}

function cursorFor(entries: UpdatesLogEntry[]): LogCursor {
  const timestamp = Math.max(...entries.map((entry) => entry.timestamp));
  const keys = entries
    .filter((entry) => REPORTABLE_LEVELS.has(entry.level))
    .filter((entry) => entry.timestamp >= timestamp - CURSOR_OVERLAP_MS)
    .map(entryKey);
  return { timestamp, keys };
}

function reportEntry(
  reporter: ObserveReporter,
  entry: UpdatesLogEntry,
  reportWarnings: boolean
): void {
  const isError = entry.level === 'error' || entry.level === 'fatal';
  if (entry.key === ERROR_RECOVERY_CRASH_KEY) {
    return;
  }
  if (entry.key === ERROR_RECOVERY_KEY && isError) {
    reporter.reportError(
      { type: ERROR_RECOVERY_TYPE, message: entry.message, code: entry.code },
      { skipFilter: true, limit: ERROR_RECOVERY_LIMIT }
    );
    return;
  }
  if (isError) {
    // The code leads the message, so each code gets its own error group and shows in the list.
    reporter.reportError(
      { type: ERROR_TYPE, message: `${entry.code}: ${entry.message}`, code: entry.code },
      { filterValue: entry }
    );
    return;
  }
  if (entry.level === 'warn' && reportWarnings) {
    reporter.reportWarning(
      {
        name: WARNING_EVENT,
        displayName: 'Updates warning',
        message: entry.message,
        code: entry.code,
        attributes: {
          logTimestamp: entry.timestamp,
          ...(entry.updateId ? { updateId: entry.updateId } : {}),
          ...(entry.assetId ? { assetId: entry.assetId } : {}),
        },
      },
      { filterValue: entry }
    );
  }
}

/**
 * Creates the Observe integration for `expo-updates`. When `Observe.configure` enables it, it
 * reports the log entries written since the last report, and then each entry as `expo-updates`
 * logs it: errors as Observe errors named `updates.error`, with the entry's code at the start of
 * the message (or `updates.error_recovery` for a JS error that error recovery handled), and, when
 * `reportWarnings` is set, warnings as `updates.warning` events.
 */
export function createExpoUpdatesObserveIntegration(log: ExpoUpdatesLog): ObserveIntegration & {
  /** The read of the entries written since the last report, while it runs. */
  readonly pendingRead: Promise<void> | null;
} {
  let reporter: ObserveReporter | null = null;
  let reportWarnings = false;
  let subscription: EventSubscription | null = null;
  let cursor: LogCursor | null = null;
  let cursorWrite: Promise<void> = Promise.resolve();
  let readInProgress: Promise<void> | null = null;
  const handledKeys = new Set<string>();

  function rememberHandled(key: string): void {
    handledKeys.add(key);
    if (handledKeys.size > MAX_HANDLED_KEYS) {
      handledKeys.delete(handledKeys.values().next().value!);
    }
  }

  /**
   * Stores the cursor. The writes run one after another, so an older cursor cannot overwrite a
   * newer one.
   */
  function storeCursor(activeReporter: ObserveReporter, value: LogCursor): void {
    const serialized = JSON.stringify(value);
    cursorWrite = cursorWrite
      .then(() => activeReporter.storage.setItem(CURSOR_KEY, serialized))
      .catch((error) => {
        console.warn(
          '[expo-updates] The Observe integration could not store its log cursor, so some log ' +
            `entries may be reported again on the next launch. Error: ${String(error)}`
        );
      });
  }

  /**
   * Reports the entries, in timestamp order, that were not handled yet in this JS session, and
   * moves the cursor past them.
   */
  function handleEntries(entries: UpdatesLogEntry[]): void {
    const activeReporter = reporter;
    if (!activeReporter) {
      return;
    }
    const newEntries = entries
      .filter((entry) => !handledKeys.has(entryKey(entry)))
      .sort((a, b) => a.timestamp - b.timestamp);
    if (newEntries.length === 0) {
      return;
    }
    for (const entry of newEntries) {
      rememberHandled(entryKey(entry));
      reportEntry(activeReporter, entry, reportWarnings);
    }
    cursor = mergeCursors(cursor, cursorFor(newEntries));
    storeCursor(activeReporter, cursor!);
  }

  async function readAndReport(activeReporter: ObserveReporter): Promise<void> {
    const now = Date.now();
    const storedCursor = parseCursor(await activeReporter.storage.getItem(CURSOR_KEY), now);
    storedCursor?.keys.forEach(rememberHandled);
    cursor = mergeCursors(cursor, storedCursor);
    let entries: UpdatesLogEntry[];
    try {
      entries = await log.readLogEntriesAsync(lookbackFrom(storedCursor, now));
    } catch (error) {
      console.warn(
        '[expo-updates] The Observe integration could not read the expo-updates log, so its ' +
          `entries are not reported in this launch. Error: ${String(error)}`
      );
      return;
    }
    handleEntries(
      entries.filter(
        (entry) => !storedCursor || entry.timestamp >= storedCursor.timestamp - CURSOR_OVERLAP_MS
      )
    );
    await cursorWrite;
  }

  return {
    name: 'expo-updates',
    get pendingRead() {
      return readInProgress;
    },
    configure(config, newReporter) {
      const options =
        typeof config === 'object' && config !== null
          ? (config as ExpoUpdatesIntegrationConfig)
          : {};
      reporter = newReporter;
      reportWarnings = options.reportWarnings ?? false;
      // Subscribe before the read, so no entry falls between the two. `handleEntries` reports an
      // entry that arrives from both once.
      subscription ??= log.addLogEntryListener((entry) => handleEntries([entry]));
      readInProgress ??= readAndReport(newReporter)
        .catch((error) => {
          console.warn(
            '[expo-updates] The Observe integration could not read or store its log cursor, so ' +
              `some log entries may be reported again or not at all. Error: ${String(error)}`
          );
        })
        .finally(() => {
          readInProgress = null;
        });
    },
    disable() {
      reporter = null;
      subscription?.remove();
      subscription = null;
    },
  };
}
