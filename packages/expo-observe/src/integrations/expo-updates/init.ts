import AppMetrics from 'expo-app-metrics';

import { reportCaughtError } from '../../reportCaughtError';
import type { ObserveIntegrationsConfig } from '../../types';
import { loadUpdates, type LoadedUpdates, type UpdatesLogEntry } from './updates';

const ERROR_TYPE = 'updates.error';
const ERROR_RECOVERY_TYPE = 'updates.error_recovery';
const WARNING_EVENT = 'updates.warning';

// expo-updates logs a JS error that error recovery handles with this code, and with a message that
// starts with this prefix: "ErrorRecovery fatal exception: ..." on iOS and
// "ErrorRecovery: exception encountered: ..." on Android.
const ERROR_RECOVERY_CODE = 'JSRuntimeError';
const ERROR_RECOVERY_MESSAGE_PREFIX = 'ErrorRecovery';
// When error recovery cannot recover, it logs this message just before the app crashes:
// "ErrorRecovery: could not recover ..." on iOS and "UpdatesErrorRecovery: could not recover ..." on
// Android. Observe already reports the crash, and the error that started error recovery is
// reported as `updates.error_recovery`, so this entry adds no error of its own.
const ERROR_RECOVERY_CRASH_MESSAGE = 'ErrorRecovery: could not recover from error, crashing';

// expo-updates keeps log entries for one day and reads back at most one day.
const MAX_LOOKBACK_MS = 86_400_000;
// Before expo-updates wrote millisecond timestamps, iOS truncated them to whole seconds, so the
// read starts one second before the cursor and the keys of that second remove the overlap.
const CURSOR_OVERLAP_MS = 1000;

// The same limits as the react-native-reanimated integration: each distinct message is reported at
// most once per window, at most 20 distinct messages per level per window, and messages are
// deduplicated by their first 500 characters. Errors and warnings have separate windows.
const REPORT_WINDOW_MS = 15 * 60_000;
const MAX_DISTINCT_MESSAGES_PER_WINDOW = 20;
const MAX_MESSAGE_LENGTH = 500;

// The levels that the integration can report. The cursor stores keys only for these entries,
// because an entry at a lower level that is read again is never reported.
const REPORTABLE_LEVELS: ReadonlySet<string> = new Set(['warn', 'error', 'fatal']);

/**
 * Native storage for the log cursor, so that a log entry is not reported again on a later start.
 */
export interface ExpoUpdatesLogCursorStore {
  getExpoUpdatesLogCursor(): Promise<string | null>;
  setExpoUpdatesLogCursor(cursor: string): Promise<void>;
}

/**
 * The timestamp of the newest log entry that was read, and the keys of the entries in the second
 * before it.
 */
type LogCursor = { timestamp: number; keys: string[] };

type Settings = {
  reportWarnings: boolean;
  ignoredCodes: readonly string[];
  shouldReport: ((entry: UpdatesLogEntry) => boolean) | undefined;
};

// Maps the capped text of each message reported in the current window to the time it was
// reported, from the monotonic `performance.now()`. A `Map` keeps insertion order, so the oldest
// report is always first.
const reportedErrors = new Map<string, number>();
const reportedWarnings = new Map<string, number>();

let isEnabled = false;
let settings: Settings = { reportWarnings: false, ignoredCodes: [], shouldReport: undefined };
let hasWarnedAboutShouldReport = false;
let readInProgress: Promise<void> | null = null;

/**
 * An expo-updates log entry reported to Observe. The stack is removed, because a stack from this
 * constructor would point at the integration rather than at the code that logged the entry.
 */
class ExpoUpdatesLogError extends Error {
  constructor(type: string, message: string) {
    super(message);
    this.name = type;
    this.stack = undefined;
  }
}

function removeExpiredReports(reported: Map<string, number>, now: number): void {
  for (const [message, reportedAt] of reported) {
    if (now - reportedAt < REPORT_WINDOW_MS) {
      return;
    }
    reported.delete(message);
  }
}

function isWithinLimits(reported: Map<string, number>, key: string): boolean {
  const now = performance.now();
  removeExpiredReports(reported, now);
  if (reported.has(key) || reported.size >= MAX_DISTINCT_MESSAGES_PER_WINDOW) {
    return false;
  }
  reported.set(key, now);
  return true;
}

function isErrorRecoveryEntry(entry: UpdatesLogEntry): boolean {
  return (
    entry.code === ERROR_RECOVERY_CODE && entry.message.startsWith(ERROR_RECOVERY_MESSAGE_PREFIX)
  );
}

function isErrorRecoveryCrashEntry(entry: UpdatesLogEntry): boolean {
  return entry.message.includes(ERROR_RECOVERY_CRASH_MESSAGE);
}

function passesFilters(entry: UpdatesLogEntry): boolean {
  if (settings.ignoredCodes.includes(entry.code)) {
    return false;
  }
  if (!settings.shouldReport) {
    return true;
  }
  try {
    return settings.shouldReport(entry);
  } catch (error) {
    if (!hasWarnedAboutShouldReport) {
      hasWarnedAboutShouldReport = true;
      console.warn(
        "[expo-observe] The 'expo-updates' integration's `shouldReport` function threw, so the " +
          'log entry is reported. Fix the function so that it returns a boolean. ' +
          `Error: ${String(error)}`
      );
    }
    return true;
  }
}

function reportEntry(entry: UpdatesLogEntry): void {
  const isError = entry.level === 'error' || entry.level === 'fatal';
  if (!isError && !(entry.level === 'warn' && settings.reportWarnings)) {
    return;
  }
  if (isErrorRecoveryCrashEntry(entry)) {
    return;
  }
  const isErrorRecovery = isErrorRecoveryEntry(entry);
  if (!isErrorRecovery && !passesFilters(entry)) {
    return;
  }
  const cappedMessage = entry.message.slice(0, MAX_MESSAGE_LENGTH);
  if (!isWithinLimits(isError ? reportedErrors : reportedWarnings, cappedMessage)) {
    return;
  }
  if (isError) {
    // The code leads the message, so each code gets its own error group and shows in the list.
    const error = isErrorRecovery
      ? new ExpoUpdatesLogError(ERROR_RECOVERY_TYPE, entry.message)
      : new ExpoUpdatesLogError(ERROR_TYPE, `${entry.code}: ${entry.message}`);
    reportCaughtError(error, 'integration');
    return;
  }
  AppMetrics.logEvent(WARNING_EVENT, {
    displayName: 'Updates warning',
    body: entry.message,
    severity: 'warn',
    // `eas observe:events` and `observe:session` show `attributes` but not `body`, so the
    // message is copied here to stay queryable.
    attributes: {
      message: cappedMessage,
      code: entry.code,
      logTimestamp: entry.timestamp,
      ...(entry.updateId ? { updateId: entry.updateId } : {}),
      ...(entry.assetId ? { assetId: entry.assetId } : {}),
    },
  });
}

function entryKey(entry: UpdatesLogEntry): string {
  return `${entry.timestamp}|${entry.code}|${entry.message}`;
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

function keyTimestamp(key: string): number {
  return Number(key.slice(0, key.indexOf('|')));
}

/**
 * Moves the cursor to the newest entry, and keeps the keys of the entries in the second before it,
 * including the keys from the previous cursor.
 */
function nextCursor(previous: LogCursor | null, sortedEntries: UpdatesLogEntry[]): LogCursor {
  const newest = sortedEntries[sortedEntries.length - 1]!;
  const keyThreshold = newest.timestamp - CURSOR_OVERLAP_MS;
  const newKeys = sortedEntries.filter((entry) => REPORTABLE_LEVELS.has(entry.level)).map(entryKey);
  const keys = [...(previous?.keys ?? []), ...newKeys].filter(
    (key) => keyTimestamp(key) >= keyThreshold
  );
  return { timestamp: newest.timestamp, keys: [...new Set(keys)] };
}

async function readAndReport(
  updates: LoadedUpdates,
  cursorStore: ExpoUpdatesLogCursorStore
): Promise<void> {
  const now = Date.now();
  const cursor = parseCursor(await cursorStore.getExpoUpdatesLogCursor(), now);
  let entries: UpdatesLogEntry[];
  try {
    entries = await updates.readLogEntriesAsync(lookbackFrom(cursor, now));
  } catch (error) {
    console.warn(
      "[expo-observe] The 'expo-updates' integration could not read the expo-updates log, so its " +
        `entries are not reported in this launch. Error: ${String(error)}`
    );
    return;
  }

  const seenKeys = new Set(cursor?.keys);
  const newEntries = entries
    .filter((entry) => !cursor || entry.timestamp >= cursor.timestamp)
    .filter((entry) => !seenKeys.has(entryKey(entry)))
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const entry of newEntries) {
    if (!isEnabled) {
      return;
    }
    reportEntry(entry);
  }

  if (newEntries.length > 0) {
    await cursorStore.setExpoUpdatesLogCursor(JSON.stringify(nextCursor(cursor, newEntries)));
  }
}

/**
 * Reports the expo-updates log entries written since the last report: errors as Observe errors
 * named `updates.error`, with the entry's code at the start of the message (or
 * `updates.error_recovery` for a JS error that expo-updates error recovery handled), and, when
 * `reportWarnings` is set, warnings as `updates.warning` events. Returns when the entries are read
 * and reported.
 */
export function initExpoUpdatesIntegration(
  config: NonNullable<ObserveIntegrationsConfig['expo-updates']>,
  cursorStore: ExpoUpdatesLogCursorStore
): Promise<void> {
  const updates = loadUpdates();
  if (!updates) {
    console.warn(
      "[expo-observe] `integrations: { 'expo-updates': ... }` was set, but `expo-updates` is not " +
        'installed. The integration will not initialize.'
    );
    return Promise.resolve();
  }

  const options = typeof config === 'object' ? config : {};
  settings = {
    reportWarnings: options.reportWarnings ?? false,
    ignoredCodes: options.ignoredCodes ?? [],
    shouldReport: options.shouldReport,
  };
  hasWarnedAboutShouldReport = false;
  isEnabled = true;

  readInProgress ??= readAndReport(updates, cursorStore)
    .catch((error) => {
      console.warn(
        "[expo-observe] The 'expo-updates' integration could not read or store its log cursor, " +
          'so some log entries may be reported again or not at all. ' +
          `Error: ${String(error)}`
      );
    })
    .finally(() => {
      readInProgress = null;
    });
  return readInProgress;
}

/**
 * Stops reporting expo-updates log entries to Observe.
 */
export function disableExpoUpdatesIntegration(): void {
  isEnabled = false;
}
