import AppMetrics from 'expo-app-metrics';

/**
 * The `reportError` payload shape sent to the native AppMetrics module. The native record types
 * `type`/`stacktrace` as optional strings and `message` as a required string, so a non-string value
 * would fail the record decode and drop the report. Every field is normalized to a string here.
 */
type NormalizedReportedError = {
  type?: string;
  message: string;
  stacktrace?: string;
};

/** Returns `value` when it's a string, otherwise `undefined`, so non-string fields never reach native. */
function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Normalizes an arbitrary caught value into the fields the native `reportError` expects, the way the
 * global `ErrorUtils` handler does.
 */
function normalizeReportedError(error: unknown): NormalizedReportedError {
  // Only a real `Error` contributes name/message/stack, and each only when it's actually a string;
  // an `Error` with non-string fields would otherwise reach the native string fields (e.g. a mutated
  // `message`) and fail the record decode.
  if (error instanceof Error) {
    return {
      type: stringOrUndefined(error.name),
      message: stringOrUndefined(error.message) ?? String(error),
      stacktrace: stringOrUndefined(error.stack),
    };
  }
  // Any non-Error throw (a string, a plain object, a number) becomes its stringification, no stack.
  return { message: String(error) };
}

/**
 * Reports a caught value as a non-fatal `reportedByUser`-source error through the AppMetrics module,
 * shared by the native and web `Observe.reportError` implementations.
 *
 * Never throws: it's called from a `catch` block, so a failure here (a pathological thrown value, or
 * a native call that rejects the payload) must not turn a handled error into an unhandled one.
 */
export function reportCaughtError(error: unknown): void {
  try {
    AppMetrics.reportError({
      source: 'reportedByUser',
      ...normalizeReportedError(error),
      isFatal: false,
    });
  } catch (reportingError) {
    if (__DEV__) {
      console.warn('[expo-observe] `reportError` failed to record the error:', reportingError);
    }
  }
}
