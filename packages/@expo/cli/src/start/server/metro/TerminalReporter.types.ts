import type { ReportableEvent } from 'metro';
import type { TerminalReportableEvent } from 'metro/src/lib/TerminalReporter';
import type { Terminal } from 'metro-core';

import { MetroEnvironment } from '../middleware/metroOptions';

export type GlobalCacheDisabledReason = 'too_many_errors' | 'too_many_misses';

export type BundleDetails = {
  buildID?: string;
  bundleType: string;
  dev: boolean;
  entryFile: string;
  minify: boolean;
  platform: string | null | undefined;
  customTransformOptions?: { environment?: MetroEnvironment };
  runtimeBytecodeVersion: number | null | undefined;
};

export type BundleProgress = {
  bundleDetails: BundleDetails;
  transformedFileCount: number;
  totalFileCount: number;
  ratio: number;
};

export type BundleProgressUpdate = {
  buildID: string;
  transformedFileCount: number;
  totalFileCount: number;
};

export { TerminalReportableEvent };

export type BuildPhase = 'in_progress' | 'done' | 'failed';

/**
 * Code across the application takes a reporter as an option and calls the
 * update whenever one of the ReportableEvent happens. Code does not directly
 * write to the standard output, because a build would be:
 *
 *   1. ad-hoc, embedded into another tool, in which case we do not want to
 *   pollute that tool's own output. The tool is free to present the
 *   warnings/progress we generate any way they want, by specifying a custom
 *   reporter.
 *   2. run as a background process from another tool, in which case we want
 *   to expose updates in a way that is easily machine-readable, for example
 *   a JSON-stream. We don't want to pollute it with textual messages.
 *
 * We centralize terminal reporting into a single place because we want the
 * output to be robust and consistent. The most common reporter is
 * TerminalReporter, that should be the only place in the application should
 * access the `terminal` module (nor the `console`).
 */
export type Reporter = { update(event: ReportableEvent): void };

export interface SnippetError extends Error {
  code?: string;
  filename?: string;
  snippet?: string;

  /** Module that failed to load ex 'fs' */
  targetModuleName?: string;
  originModulePath?: string;

  errors?: any[];
}

export interface TerminalReporterInterface {
  new (terminal: Terminal): TerminalReporterInterface;

  /**
   * The bundle builds for which we are actively maintaining the status on the
   * terminal, ie. showing a progress bar. There can be several bundles being
   * built at the same time.
   */
  _activeBundles: Map<string, BundleProgress>;

  _scheduleUpdateBundleProgress: {
    (data: { buildID: string; transformedFileCount: number; totalFileCount: number }): void;
    cancel(): void;
  };

  /** Set in super type */
  terminal: Terminal;

  /**
   * Construct a message that represents the progress of a
   * single bundle build, for example:
   *
   *     BUNDLE path/to/bundle.js ▓▓▓▓▓░░░░░░░░░░░ 36.6% (4790/7922)
   */
  _getBundleStatusMessage(
    {
      bundleDetails: { entryFile, bundleType, runtimeBytecodeVersion },
      transformedFileCount,
      totalFileCount,
      ratio,
    }: BundleProgress,
    phase: BuildPhase
  ): string;

  /**
   * This function is only concerned with logging and should not do state
   * or terminal status updates.
   */
  _log(event: TerminalReportableEvent): void;

  _logCacheDisabled(reason: GlobalCacheDisabledReason): void;

  _logBundleBuildDone(buildID: string): void;

  _logBundleBuildFailed(buildID: string): void;

  _logInitializing(port: number, hasReducedPerformance: boolean): void;

  _logInitializingFailed(port: number, error: SnippetError): void;

  /**
   * We do not want to log the whole stacktrace for bundling error, because
   * these are operational errors, not programming errors, and the stacktrace
   * is not actionable to end users.
   */
  _logBundlingError(error: SnippetError): void;

  /**
   * We use Math.pow(ratio, 2) to as a conservative measure of progress because
   * we know the `totalCount` is going to progressively increase as well. We
   * also prevent the ratio from going backwards.
   */
  _updateBundleProgress({
    buildID,
    transformedFileCount,
    totalFileCount,
  }: BundleProgressUpdate): void;

  /**
   * This function is exclusively concerned with updating the internal state.
   * No logging or status updates should be done at this point.
   */
  _updateState(event: TerminalReportableEvent): void;
  /**
   * Return a status message that is always consistent with the current state
   * of the application. Having this single function ensures we don't have
   * different call sites overriding each other status messages.
   */
  _getStatusMessage(): string;

  _logHmrClientError(e: Error): void;

  /**
   * Single entry point for reporting events. That allows us to implement the
   * corresponding JSON reporter easily and have a consistent reporting.
   */
  update(event: TerminalReportableEvent): void;
}
