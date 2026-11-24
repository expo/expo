import type { ObserveAttributes } from '../types';

// The reporter that the integration registry passes to the integrations of Expo libraries. Not
// public API.

/**
 * Options that a library integration accepts in its config, so that every integration filters
 * reports the same way. `T` is the value that its `shouldReport` gets.
 */
export type ObserveIntegrationFilterConfig<T = unknown> = {
  /**
   * Returns whether a report is sent. It gets the value that the integration documents, such as
   * the log entry the report comes from, or the report itself. When it throws, the report is sent
   * and a warning is printed once.
   */
  shouldReport?: (value: T) => boolean;
};

/**
 * An error that a library integration reports.
 */
export type ObserveIntegrationErrorReport = {
  /** The error type, such as `updates.error`. Errors are grouped by type and message. */
  type: string;
  message: string;
  stack?: string;
  /** A stable code for the kind of error, recorded as the `expo.error.code` attribute. */
  code?: string;
};

/**
 * A warning that a library integration reports, recorded as an event at `warn` severity.
 */
export type ObserveIntegrationWarningReport = {
  /** The event name, such as `updates.warning`. */
  name: string;
  displayName?: string;
  message: string;
  /** Recorded as the `code` attribute. */
  code?: string;
  attributes?: ObserveAttributes;
};

export type ObserveIntegrationReportOptions = {
  /** The value passed to `shouldReport`. Defaults to the report itself. */
  filterValue?: unknown;
  /** Sends the report without applying `shouldReport`. */
  skipFilter?: boolean;
  /**
   * The rate limit the report counts toward. Each limit allows a distinct message at most once in
   * 15 minutes, and at most 20 distinct messages in 15 minutes. Defaults to `error` for errors and
   * `warning` for warnings, so many warnings cannot stop errors from being reported.
   */
  limit?: string;
};

/**
 * Strings that a library integration keeps across launches, such as how far it has read a log.
 * Each integration has its own keys. On web, nothing is stored and `getItem` resolves to `null`.
 */
export type ObserveIntegrationStorage = {
  getItem(key: string): Promise<string | null>;
  /** Stores the value, or removes it when the value is `null`. */
  setItem(key: string, value: string | null): Promise<void>;
};

/**
 * Reports for a library integration. Each report sets the `integration` source, applies the
 * integration's `shouldReport` option, and then the rate limit. Each function returns whether
 * the report was sent. Nothing is sent while the integration is disabled.
 */
export type ObserveIntegrationReporter = {
  storage: ObserveIntegrationStorage;
  reportError(
    report: ObserveIntegrationErrorReport,
    options?: ObserveIntegrationReportOptions
  ): boolean;
  reportWarning(
    report: ObserveIntegrationWarningReport,
    options?: ObserveIntegrationReportOptions
  ): boolean;
};
