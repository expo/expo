import AppMetrics from 'expo-app-metrics';

import { reportCaughtError } from '../../reportCaughtError';
import type { ObserveIntegrationsConfig } from '../../types';
import { loadReanimated, type ReanimatedLogData } from './reanimated';

// Value of Reanimated's `ReanimatedLogLevel.error`.
const LOG_LEVEL_ERROR = 2;

// `configureReanimatedLogger` accepts an `onLog` callback since Reanimated 4.7.0.
const MIN_MAJOR = 4;
const MIN_MINOR = 7;

const REANIMATED_ERROR_NAME = 'reanimated.error';
const REANIMATED_WARNING_EVENT = 'reanimated.warning';

// A UI-runtime log can repeat every frame, so each distinct message is reported once. The cap
// bounds the set when messages embed varying values.
const MAX_DISTINCT_MESSAGES = 100;
// Attribute values are sent on every dispatch, and strict-mode messages append a docs
// reference, so the copied message is capped.
const MAX_MESSAGE_LENGTH = 500;

const reportedMessages = new Set<string>();

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

function shouldReport(message: string): boolean {
  if (reportedMessages.has(message) || reportedMessages.size >= MAX_DISTINCT_MESSAGES) {
    return false;
  }
  reportedMessages.add(message);
  return true;
}

// Reanimated already prints every log to the console, so this only reports to Observe.
function reportReanimatedLog({ level, message }: ReanimatedLogData): void {
  if (!shouldReport(message)) {
    return;
  }
  if (level === LOG_LEVEL_ERROR) {
    // For a log on the React Native runtime, Reanimated calls `onLog` synchronously, so this
    // stack includes the frames that led to the log. A log on the UI runtime is delivered later,
    // so its stack only shows the delivery.
    reportCaughtError(new ReanimatedError(message, new Error(message).stack));
    return;
  }
  AppMetrics.logEvent(REANIMATED_WARNING_EVENT, {
    displayName: 'Reanimated warning',
    body: message,
    severity: 'warn',
    // `eas observe:events` and `observe:session` show `attributes` but not `body`, so the
    // message is copied here to stay queryable.
    attributes: { message: message.slice(0, MAX_MESSAGE_LENGTH) },
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
