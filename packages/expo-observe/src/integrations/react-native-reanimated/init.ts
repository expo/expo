import AppMetrics from 'expo-app-metrics';

import { reportCaughtError } from '../../reportCaughtError';
import type { ObserveIntegrationsConfig } from '../../types';
import { createReportLimiter } from '../reportLimiter';
import { loadReanimated, type ReanimatedLogData } from './reanimated';
import { removeFirstFrame } from './stack';

// Value of Reanimated's `ReanimatedLogLevel.error`.
const LOG_LEVEL_ERROR = 2;

// `configureReanimatedLogger` accepts an `onLog` callback since Reanimated 4.7.0.
const MIN_MAJOR = 4;
const MIN_MINOR = 7;

const REANIMATED_ERROR_NAME = 'reanimated.error';
const REANIMATED_WARNING_EVENT = 'reanimated.warning';

const errorLimiter = createReportLimiter();
const warningLimiter = createReportLimiter();

// The callback stays registered in Reanimated after the integration is turned off, because
// configuring the logger again would reset the app's `level` and `strict`. It checks this flag.
let isEnabled = false;
let shouldReportWarnings = false;

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

// Reanimated already prints every log to the console, so this only reports to Observe. The name
// is specific to Observe, so `removeFirstFrame` cannot remove a frame of an app function.
function __expo_observe_reportReanimatedLog({ level, message }: ReanimatedLogData): void {
  if (!isEnabled) {
    return;
  }
  const isError = level === LOG_LEVEL_ERROR;
  if (!isError && !shouldReportWarnings) {
    return;
  }
  const cappedMessage = (isError ? errorLimiter : warningLimiter).allow(message);
  if (cappedMessage === null) {
    return;
  }
  if (isError) {
    // For a log on the React Native runtime, Reanimated calls `onLog` synchronously, so this
    // stack includes the frames that led to the log. A log on the UI runtime is delivered later,
    // so its stack has no frames left after `removeFirstFrame`.
    const stack = removeFirstFrame(
      new Error(message).stack,
      __expo_observe_reportReanimatedLog.name
    );
    reportCaughtError(new ReanimatedError(message, stack), 'integration');
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
 * callback that reports Reanimated errors to Observe as `reanimated.error` errors. When
 * `reportWarnings` is set, the callback also reports Reanimated warnings as `reanimated.warning`
 * events.
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

  const { reportWarnings = false, ...loggerConfig } = typeof config === 'object' ? config : {};
  reanimated.configureReanimatedLogger(loggerConfig, __expo_observe_reportReanimatedLog);
  shouldReportWarnings = reportWarnings;
  isEnabled = true;
}

/**
 * Stops reporting Reanimated errors and warnings to Observe. Reanimated's logger keeps its
 * configuration.
 */
export function disableReanimatedIntegration(): void {
  isEnabled = false;
}
