import chalk from 'chalk';
import { ReportableEvent } from 'metro';
import UpstreamTerminalReporter, { TerminalReportableEvent } from 'metro/src/lib/TerminalReporter';
import util from 'util';

export type GlobalCacheDisabledReason = 'too_many_errors' | 'too_many_misses';
export type BundleDetails = {
  bundleType: string;
  dev: boolean;
  entryFile: string;
  minify: boolean;
  platform: string | null | undefined;
  runtimeBytecodeVersion: number | null | undefined;
};

export type BundleProgress = {
  bundleDetails: BundleDetails;
  transformedFileCount: number;
  totalFileCount: number;
  ratio: number;
};

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

import type { Terminal } from 'metro-core';
import { stripAnsi } from '../../utils/ansi';

/**
 * A standard way to log a warning to the terminal. This should not be called
 * from some arbitrary Metro logic, only from the reporters. Instead of
 * calling this, add a new type of ReportableEvent instead, and implement a
 * proper handler in the reporter(s).
 */
export function logWarning(terminal: Terminal, format: string, ...args: Array<any>): void {
  const str = util.format(format, ...args);
  terminal.log('%s: %s', chalk.yellow('warning'), str);
}

/**
 * Similar to `logWarning`, but for messages that require the user to act.
 */
export function logError(terminal: Terminal, format: string, ...args: Array<any>): void {
  terminal.log(
    '%s: %s',
    chalk.red('error'),
    // Syntax errors may have colors applied for displaying code frames
    // in various places outside of where Metro is currently running.
    // If the current terminal does not support color, we'll strip the colors
    // here.
    util.format(chalk.supportsColor ? format : stripAnsi(format), ...args)
  );
}

interface TerminalReporterInterface {
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
  }: {
    buildID: string;
    transformedFileCount: number;
    totalFileCount: number;
  }): void;

  /**
   * This function is exclusively concerned with updating the internal state.
   * No logging or status updates should be done at this point.
   */
  _updateState(event: TerminalReportableEvent): void;
  /**
   * Return a status message that is always consistent with the current state
   * of the application. Having this single function ensures we don't have
   * different callsites overriding each other status messages.
   */
  _getStatusMessage(): string;

  _logHmrClientError(e: Error): void;

  /**
   * Single entry point for reporting events. That allows us to implement the
   * corresponding JSON reporter easily and have a consistent repor∏ting.
   */
  update(event: TerminalReportableEvent): void;
}

const XTerminalReporter = UpstreamTerminalReporter as unknown as TerminalReporterInterface;

/** Extended TerminalReporter class but with proper types and extra functionality to avoid using the `_log` method directly in subclasses. */
export class TerminalReporter extends XTerminalReporter implements TerminalReporterInterface {
  /**
   * A cache of { [buildID]: BundleDetails } which can be used to
   * add more contextual logs. BundleDetails is currently only sent with `bundle_build_started`
   * so we need to cache the details in order to print the platform info with other event types.
   */
  _bundleDetails: Map<string, BundleDetails> = new Map();

  _log(event: TerminalReportableEvent): void {
    switch (event.type) {
      case 'transform_cache_reset':
        return this.transformCacheReset();
      case 'dep_graph_loading':
        return this.dependencyGraphLoading(event.hasReducedPerformance);
      case 'client_log':
        if (this.shouldFilterClientLog(event)) {
          return;
        }
        break;
    }
    return super._log(event);
  }

  /** Gives subclasses an easy interface for filtering out logs. Return `true` to skip. */
  protected shouldFilterClientLog(event: {
    type: 'client_log';
    level: 'trace' | 'info' | 'warn' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug';
    data: unknown[];
  }): boolean {
    return false;
  }

  /** Cache has been reset. */
  protected transformCacheReset(): void {}

  /** One of the first logs that will be printed. */
  protected dependencyGraphLoading(hasReducedPerformance: boolean): void {}

  /**
   * This function is exclusively concerned with updating the internal state.
   * No logging or status updates should be done at this point.
   */

  _updateState(event) {
    switch (event.type) {
      case 'bundle_build_done':
      case 'bundle_build_failed':
        this._activeBundles.delete(event.buildID);

        break;

      case 'bundle_build_started':
        {
          const bundleProgress = {
            bundleDetails: event.bundleDetails,
            transformedFileCount: 0,
            totalFileCount: 1,
            ratio: 0,
          };

          this._activeBundles.set(event.buildID, bundleProgress);
          this._bundleDetails.set(event.buildID, event.bundleDetails);
        }
        break;

      case 'bundle_transform_progressed':
        if (event.totalFileCount === event.transformedFileCount) {
          this._scheduleUpdateBundleProgress.cancel();

          this._updateBundleProgress(event);
        } else {
          this._scheduleUpdateBundleProgress(event);
        }

        break;

      case 'bundle_transform_progressed_throttled':
        this._updateBundleProgress(event);

        break;
    }
  }
}

export { TerminalReportableEvent };
