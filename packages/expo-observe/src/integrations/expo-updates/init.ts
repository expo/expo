import AppMetrics from 'expo-app-metrics';

import { reportCaughtError } from '../../reportCaughtError';
import type { ObserveIntegrationsConfig } from '../../types';
import { createReportLimiter } from '../reportLimiter';
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

// The levels that the integration can report. The cursor stores keys only for these entries,
// because an entry at a lower level that is read again is never reported.
const REPORTABLE_LEVELS: ReadonlySet<string> = new Set(['warn', 'error', 'fatal']);

// Keys of the entries handled in this JS session, so an entry that arrives both live and in the
// read is reported once. Only the newest keys are kept.
const MAX_HANDLED_KEYS = 1000;

/**
 * The parts of the native `ExpoObserve` module that the integration uses: storage for the log
 * cursor, so that a log entry is not reported again on a later start, and the live listener for
 * entries that expo-updates logs while the app runs.
 */
export interface ExpoUpdatesNativeModule {
  getExpoUpdatesLogCursor(): Promise<string | null>;
  setExpoUpdatesLogCursor(cursor: string): Promise<void>;
  setExpoUpdatesLogListenerEnabled(enabled: boolean): void;
  addListener(
    eventName: 'expoUpdatesLogEntry',
    listener: (entry: UpdatesLogEntry) => void
  ): { remove(): void };
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

const errorLimiter = createReportLimiter();
// Error recovery entries skip the filters, so they also get their own limit, and many distinct
// errors cannot stop them from being reported.
const errorRecoveryLimiter = createReportLimiter();
const warningLimiter = createReportLimiter();

let isEnabled = false;
let settings: Settings = { reportWarnings: false, ignoredCodes: [], shouldReport: undefined };
let hasWarnedAboutShouldReport = false;
let readInProgress: Promise<void> | null = null;

let nativeModule: ExpoUpdatesNativeModule | null = null;
let liveSubscription: { remove(): void } | null = null;
let cursor: LogCursor | null = null;
let cursorWrite: Promise<void> = Promise.resolve();
const handledKeys = new Set<string>();

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
  const limiter = isErrorRecovery ? errorRecoveryLimiter : isError ? errorLimiter : warningLimiter;
  const cappedMessage = limiter.allow(entry.message);
  if (cappedMessage === null) {
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

function rememberHandled(key: string): void {
  handledKeys.add(key);
  if (handledKeys.size > MAX_HANDLED_KEYS) {
    handledKeys.delete(handledKeys.values().next().value!);
  }
}

/**
 * Stores the cursor. The writes run one after another, so an older cursor cannot overwrite a newer
 * one.
 */
function storeCursor(native: ExpoUpdatesNativeModule, value: LogCursor): void {
  const serialized = JSON.stringify(value);
  cursorWrite = cursorWrite
    .then(() => native.setExpoUpdatesLogCursor(serialized))
    .catch((error) => {
      console.warn(
        "[expo-observe] The 'expo-updates' integration could not store its log cursor, so some " +
          'log entries may be reported again on the next launch. ' +
          `Error: ${String(error)}`
      );
    });
}

/**
 * Reports the entries, in timestamp order, that were not handled yet in this JS session, and moves
 * the cursor past them.
 */
function handleEntries(native: ExpoUpdatesNativeModule, entries: UpdatesLogEntry[]): void {
  const newEntries = entries
    .filter((entry) => !handledKeys.has(entryKey(entry)))
    .sort((a, b) => a.timestamp - b.timestamp);
  if (newEntries.length === 0) {
    return;
  }
  for (const entry of newEntries) {
    if (!isEnabled) {
      return;
    }
    rememberHandled(entryKey(entry));
    reportEntry(entry);
  }
  const updatedCursor = mergeCursors(cursor, cursorFor(newEntries))!;
  cursor = updatedCursor;
  storeCursor(native, updatedCursor);
}

async function readAndReport(
  updates: LoadedUpdates,
  native: ExpoUpdatesNativeModule
): Promise<void> {
  const now = Date.now();
  const storedCursor = parseCursor(await native.getExpoUpdatesLogCursor(), now);
  storedCursor?.keys.forEach(rememberHandled);
  cursor = mergeCursors(cursor, storedCursor);
  let entries: UpdatesLogEntry[];
  try {
    entries = await updates.readLogEntriesAsync(lookbackFrom(storedCursor, now));
  } catch (error) {
    console.warn(
      "[expo-observe] The 'expo-updates' integration could not read the expo-updates log, so its " +
        `entries are not reported in this launch. Error: ${String(error)}`
    );
    return;
  }

  handleEntries(
    native,
    entries.filter((entry) => !storedCursor || entry.timestamp >= storedCursor.timestamp)
  );
  await cursorWrite;
}

function subscribeToLiveEntries(native: ExpoUpdatesNativeModule): void {
  if (liveSubscription) {
    return;
  }
  liveSubscription = native.addListener('expoUpdatesLogEntry', (entry) => {
    handleEntries(native, [entry]);
  });
  native.setExpoUpdatesLogListenerEnabled(true);
}

/**
 * Reports the expo-updates log entries written since the last report, and then each entry as
 * expo-updates logs it: errors as Observe errors named `updates.error`, with the entry's code at
 * the start of the message (or `updates.error_recovery` for a JS error that expo-updates error
 * recovery handled), and, when `reportWarnings` is set, warnings as `updates.warning` events.
 * Returns when the entries written since the last report are read and reported.
 */
export function initExpoUpdatesIntegration(
  config: NonNullable<ObserveIntegrationsConfig['expo-updates']>,
  native: ExpoUpdatesNativeModule
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
  nativeModule = native;

  // Subscribe before the read, so no entry falls between the two. `handleEntries` reports an entry
  // that arrives from both once.
  subscribeToLiveEntries(native);
  readInProgress ??= readAndReport(updates, native)
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
 * Stops reporting expo-updates log entries to Observe, and turns off the native live listener.
 */
export function disableExpoUpdatesIntegration(): void {
  isEnabled = false;
  if (liveSubscription) {
    liveSubscription.remove();
    liveSubscription = null;
    nativeModule?.setExpoUpdatesLogListenerEnabled(false);
  }
}
