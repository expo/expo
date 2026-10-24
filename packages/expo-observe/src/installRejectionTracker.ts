import { ReportLimiter } from './ReportLimiter';
import { reportCaughtError } from './reportCaughtError';

/**
 * The options of `HermesInternal.enablePromiseRejectionTracker`. Hermes calls `onUnhandled` when a
 * rejected promise still has no handler after a short delay, and `onHandled` when a handler is
 * attached later to a promise that `onUnhandled` already received.
 */
type RejectionTrackerOptions = {
  allRejections?: boolean;
  onUnhandled?: (id: number, rejection: unknown) => void;
  onHandled?: (id: number, rejection: unknown) => void;
};

type HermesInternalType = {
  hasPromise?: () => boolean;
  enablePromiseRejectionTracker?: (options: RejectionTrackerOptions) => void;
};

// Hermes keeps each rejection that reached `onUnhandled` until a handler is attached to it, and
// most never get one. Enabling the tracker again releases them. They are kept only for
// `onHandled`, which does nothing here.
const MAX_UNHANDLED_BEFORE_RESET = 10;
// Two messages that differ only after this length are reported once.
const MAX_KEY_LENGTH = 500;
const MAX_KEYS_IN_MESSAGE = 10;
const NON_ERROR_MESSAGE = 'Non-Error promise rejection';

// An unhandled rejection doesn't stop the app in production, so it can repeat for the whole
// session.
const limiter = new ReportLimiter();

let installed = false;
let enabled = true;

/**
 * Enables or disables reporting of unhandled promise rejections.
 */
export function setRejectionTrackerEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Returns the value to report for a rejection reason. An object that isn't an `Error` becomes its
 * string `message`, or a list of its keys, so the report contains no other field values.
 */
function toReportedValue(reason: unknown): unknown {
  if (reason instanceof Error || reason === null) {
    return reason;
  }
  if (typeof reason !== 'object' && typeof reason !== 'function') {
    return reason;
  }
  try {
    const { message } = reason as { message?: unknown };
    if (typeof message === 'string') {
      return message;
    }
    const keys = Object.keys(reason);
    if (keys.length === 0) {
      return NON_ERROR_MESSAGE;
    }
    return `${NON_ERROR_MESSAGE} with keys: ${keys.slice(0, MAX_KEYS_IN_MESSAGE).join(', ')}`;
  } catch {
    // A getter or a proxy can throw.
    return NON_ERROR_MESSAGE;
  }
}

function limiterKey(value: unknown): string {
  try {
    const text =
      value instanceof Error ? `${String(value.name)}: ${String(value.message)}` : String(value);
    return text.slice(0, MAX_KEY_LENGTH);
  } catch {
    // `String` throws for an `Error` field that has no primitive value.
    return '';
  }
}

/**
 * Reports promise rejections that no handler catches as non-fatal errors with the
 * `unhandledRejection` source. Does nothing in development. Only the first call installs the
 * tracker.
 */
export function installRejectionTracker(): void {
  if (installed) {
    return;
  }
  if (__DEV__) {
    // React Native and `@expo/metro-runtime` install their own trackers in development to show
    // rejections in LogBox. Hermes keeps only the options of the last call, so this tracker would
    // replace theirs.
    return;
  }
  const hermes = (globalThis as { HermesInternal?: HermesInternalType | null }).HermesInternal;
  if (!hermes?.hasPromise?.() || typeof hermes.enablePromiseRejectionTracker !== 'function') {
    // Hermes tracks only its own `Promise`. When `hasPromise()` is false, React Native replaces
    // the global `Promise` with a polyfill that Hermes doesn't track.
    return;
  }
  installed = true;

  const enableTracker = hermes.enablePromiseRejectionTracker.bind(hermes);
  let unhandledSinceReset = 0;
  const options: RejectionTrackerOptions = {
    // Without this, Hermes passes only `ReferenceError`, `TypeError`, and `RangeError` rejections.
    allRejections: true,
    onUnhandled(id, rejection) {
      const value = toReportedValue(rejection);
      if (enabled && limiter.shouldReport(limiterKey(value))) {
        reportCaughtError(value, 'unhandledRejection');
      }
      unhandledSinceReset += 1;
      if (unhandledSinceReset >= MAX_UNHANDLED_BEFORE_RESET) {
        unhandledSinceReset = 0;
        // A rejection still inside its delay keeps the old tracker, and a handler attached to it
        // later no longer stops its report.
        enableTracker(options);
      }
    },
    // Without this, Hermes prints a warning when a handler is attached to a reported rejection.
    onHandled() {},
  };
  enableTracker(options);
}
