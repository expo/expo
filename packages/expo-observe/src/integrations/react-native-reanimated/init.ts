import AppMetrics from 'expo-app-metrics';

import { reportCaughtError } from '../../reportCaughtError';
import type { ObserveIntegrationsConfig } from '../../types';
import { loadReanimated, type ReanimatedLogData } from './reanimated';
import { removeLoggerFrames } from './stack';

// Value of Reanimated's `ReanimatedLogLevel.error`.
const LOG_LEVEL_ERROR = 2;

// `configureReanimatedLogger` accepts an `onLog` callback since Reanimated 4.7.0.
const MIN_MAJOR = 4;
const MIN_MINOR = 7;

const REANIMATED_ERROR_NAME = 'reanimated.error';
const REANIMATED_WARNING_EVENT = 'reanimated.warning';

// A UI-runtime log can repeat every frame, so each distinct message is reported at most once per
// window. The cap bounds the reports in a window when messages embed varying values, and the
// window lets new messages be reported again after a surge. Errors and warnings have separate
// windows, so a screen with many distinct warnings cannot stop errors from being reported.
const REPORT_WINDOW_MS = 60_000;
const MAX_DISTINCT_MESSAGES_PER_WINDOW = 100;
// Attribute values are sent on every dispatch, and strict-mode messages append a docs
// reference, so the copied message is capped. Messages are also deduplicated by this capped
// text, so two messages that differ only after the cap do not send the same attribute twice.
const MAX_MESSAGE_LENGTH = 500;

// Maps the capped text of each message reported in the current window to the time it was
// reported. A `Map` keeps insertion order, so the oldest report is always first.
const reportedErrors = new Map<string, number>();
const reportedWarnings = new Map<string, number>();

/**
 * A Reanimated error reported to Observe. The stack is set explicitly so it points at the
 * callback's caller rather than at this constructor.
 */
class ReanimatedError extends Error {
  constructor(message: string, stack: string | undefined) {
    super(message);
    this.name = REANIMATED_ERROR_NAME;
    if (stack !== undefined) {
      this.stack = stack;
    }
  }
}

function supportsOnLog(version: string): boolean {
  const match = /^(\d+)\.(\d+)/.exec(version);
  if (!match) {
    return false;
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > MIN_MAJOR || (major === MIN_MAJOR && minor >= MIN_MINOR);
}

function removeExpiredReports(reported: Map<string, number>, now: number): void {
  for (const [message, reportedAt] of reported) {
    if (now - reportedAt < REPORT_WINDOW_MS) {
      return;
    }
    reported.delete(message);
  }
}

function shouldReport(reported: Map<string, number>, cappedMessage: string): boolean {
  const now = Date.now();
  removeExpiredReports(reported, now);
  if (reported.has(cappedMessage) || reported.size >= MAX_DISTINCT_MESSAGES_PER_WINDOW) {
    return false;
  }
  reported.set(cappedMessage, now);
  return true;
}

// Reanimated already prints every log to the console, so this only reports to Observe. The name
// of this function is matched in `removeLoggerFrames`, so keep the two in sync.
function reportReanimatedLog({ level, message }: ReanimatedLogData): void {
  const isError = level === LOG_LEVEL_ERROR;
  const cappedMessage = message.slice(0, MAX_MESSAGE_LENGTH);
  if (!shouldReport(isError ? reportedErrors : reportedWarnings, cappedMessage)) {
    return;
  }
  if (isError) {
    // For a log on the React Native runtime, Reanimated calls `onLog` synchronously, so this
    // stack includes the frames that led to the log. A log on the UI runtime is delivered later,
    // so its stack has no frames left after `removeLoggerFrames`.
    reportCaughtError(new ReanimatedError(message, removeLoggerFrames(new Error(message).stack)));
    return;
  }
  AppMetrics.logEvent(REANIMATED_WARNING_EVENT, {
    displayName: 'Reanimated warning',
    body: message,
    severity: 'warn',
    // `eas observe:events` and `observe:session` show `attributes` but not `body`, so the
    // message is copied here to stay queryable.
    attributes: { message: cappedMessage },
  });
}

/**
 * Configures Reanimated's logger with the integration's `level` and `strict` settings and a
 * callback that reports Reanimated errors to Observe as `reanimated.error` errors, and Reanimated
 * warnings as `reanimated.warning` events.
 */
export function initReanimatedIntegration(
  config: NonNullable<ObserveIntegrationsConfig['react-native-reanimated']>
): void {
  const reanimated = loadReanimated();
  if (!reanimated) {
    console.warn(
      "[expo-observe] `integrations: { 'react-native-reanimated': ... }` was set, but " +
        '`react-native-reanimated` is not installed. The integration will not initialize.'
    );
    return;
  }

  if (!supportsOnLog(reanimated.version)) {
    console.warn(
      `[expo-observe] The 'react-native-reanimated' integration requires Reanimated 4.7.0 or later, ` +
        `but Reanimated ${reanimated.version} is installed. Reanimated errors and warnings will not be ` +
        'reported to EAS Observe. Upgrade react-native-reanimated to 4.7.0 or later.'
    );
    return;
  }

  const loggerConfig = typeof config === 'object' ? config : {};
  reanimated.configureReanimatedLogger(loggerConfig, reportReanimatedLog);
}
