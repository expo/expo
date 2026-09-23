import AppMetrics from 'expo-app-metrics';

import { reportCaughtError } from '../../reportCaughtError';
import { loadReanimated, type OptionalWorklets } from './reanimated';

// Reanimated keeps its logger config on a per-runtime global and calls its internal
// `logFunction` for every log that passes the `level` and `strict` filters. `logFunction` is
// not part of the public API, so this mirrors the internal shape. It was verified against
// Reanimated 4.6 and 4.7: both keep `logFunction` when `configureReanimatedLogger` runs later.
type ReanimatedLogData = { level: number; message: string };
type ReanimatedLogFunction = (data: ReanimatedLogData) => void;
type ReanimatedLoggerConfig = {
  logFunction: ReanimatedLogFunction;
  level: number;
  strict: boolean;
};
type ReanimatedGlobal = { __reanimatedLoggerConfig?: ReanimatedLoggerConfig };

// Values of Reanimated's `ReanimatedLogLevel` enum and its default logger config.
const LOG_LEVEL_WARN = 1;
const LOG_LEVEL_ERROR = 2;
const DEFAULT_STRICT = true;

const SUPPORTED_VERSION = /^4\.[67]\./;

const REANIMATED_ERROR_NAME = 'reanimated.error';
const REANIMATED_WARNING_EVENT = 'reanimated.warning';

// A UI-runtime log can repeat every frame, so each distinct message is reported once. The cap
// bounds the set when messages embed varying values.
const MAX_DISTINCT_MESSAGES = 100;
// Attribute values are sent on every dispatch, and strict-mode messages append a docs
// reference, so the copied message is capped.
const MAX_MESSAGE_LENGTH = 500;

const reportedMessages = new Set<string>();
let installed = false;

/**
 * A Reanimated error reported to Observe. The stack is set explicitly because it is captured
 * at the log site, before the hand-off to the React Native runtime unwinds those frames.
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

function shouldReport(message: string): boolean {
  if (reportedMessages.has(message) || reportedMessages.size >= MAX_DISTINCT_MESSAGES) {
    return false;
  }
  reportedMessages.add(message);
  return true;
}

function reportReanimatedError(message: string, stack: string | undefined): void {
  if (shouldReport(message)) {
    reportCaughtError(new ReanimatedError(message, stack));
  }
}

function reportReanimatedWarning(message: string): void {
  if (shouldReport(message)) {
    AppMetrics.logEvent(REANIMATED_WARNING_EVENT, {
      displayName: 'Reanimated warning',
      body: message,
      severity: 'warn',
      // `eas observe:events` and `observe:session` show `attributes` but not `body`, so the
      // message is copied here to stay queryable.
      attributes: { message: message.slice(0, MAX_MESSAGE_LENGTH) },
    });
  }
}

// Created in a factory, after the optional `require`, because a worklet captures its closure
// when it is created: a module-level worklet would capture `scheduleOnRN` before it is loaded.
function createLogFunction(scheduleOnRN: OptionalWorklets['scheduleOnRN']): ReanimatedLogFunction {
  return (data) => {
    'worklet';
    // `scheduleOnRN` works from both runtimes: on the React Native runtime it queues a
    // microtask, and on the UI runtime it moves the call to the React Native runtime, where
    // the native module is available.
    if (data.level === LOG_LEVEL_ERROR) {
      console.error(data.message);
      scheduleOnRN(reportReanimatedError, data.message, new Error(data.message).stack);
    } else {
      console.warn(data.message);
      scheduleOnRN(reportReanimatedWarning, data.message);
    }
  };
}

// Runs on each runtime. It keeps the `level`, `strict` and any other fields that runtime
// already has, and only replaces `logFunction`.
function installLogFunction(logFunction: ReanimatedLogFunction): void {
  'worklet';
  const target = globalThis as ReanimatedGlobal;
  target.__reanimatedLoggerConfig = {
    level: LOG_LEVEL_WARN,
    strict: DEFAULT_STRICT,
    ...target.__reanimatedLoggerConfig,
    logFunction,
  };
}

/**
 * Reports Reanimated errors to Observe as `reanimated.error` errors, and Reanimated warnings as
 * `reanimated.warning` events. Console output is kept. Installs once per app launch.
 */
export function initReanimatedIntegration(): void {
  if (installed) {
    return;
  }

  const reanimated = loadReanimated();
  if (!reanimated) {
    console.warn(
      "[expo-observe] `integrations: { 'react-native-reanimated': true }` was set, but " +
        '`react-native-reanimated` or `react-native-worklets` is not installed. The integration will not initialize.'
    );
    return;
  }

  if (!SUPPORTED_VERSION.test(reanimated.version)) {
    console.warn(
      `[expo-observe] The 'react-native-reanimated' integration supports Reanimated 4.6 and 4.7, ` +
        `but Reanimated ${reanimated.version} is installed. Reanimated errors and warnings will not be ` +
        'reported to EAS Observe. Install a supported Reanimated version, or update expo-observe.'
    );
    return;
  }

  const logFunction = createLogFunction(reanimated.worklets.scheduleOnRN);
  installLogFunction(logFunction);
  reanimated.worklets.runOnUISync(installLogFunction, logFunction);
  installed = true;
}
