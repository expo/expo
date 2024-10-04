// This file represents an abstraction on the metro TerminalReporter.
// We use this abstraction to safely extend the TerminalReporter for our own custom logging.
import chalk from 'chalk';
import { Terminal } from 'metro-core';
import UpstreamTerminalReporter from 'metro/src/lib/TerminalReporter';
import util from 'util';

import { stripAnsi } from '../../../utils/ansi';
import {
  BundleDetails,
  TerminalReportableEvent,
  TerminalReporterInterface,
} from './TerminalReporter.types';

/**
 * A standard way to log a warning to the terminal. This should not be called
 * from some arbitrary Metro logic, only from the reporters. Instead of
 * calling this, add a new type of ReportableEvent instead, and implement a
 * proper handler in the reporter(s).
 */
export function logWarning(terminal: Terminal, format: string, ...args: any[]): void {
  const str = util.format(format, ...args);
  terminal.log('%s: %s', chalk.yellow('warning'), str);
}

/**
 * Similar to `logWarning`, but for messages that require the user to act.
 */
export function logError(terminal: Terminal, format: string, ...args: any[]): void {
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

const XTerminalReporter = UpstreamTerminalReporter as unknown as TerminalReporterInterface;

/** Extended TerminalReporter class but with proper types and extra functionality to avoid using the `_log` method directly in subclasses. */
export class TerminalReporter extends XTerminalReporter implements TerminalReporterInterface {
  /**
   * A cache of { [buildID]: BundleDetails } which can be used to
   * add more contextual logs. BundleDetails is currently only sent with `bundle_build_started`
   * so we need to cache the details in order to print the platform info with other event types.
   */
  _bundleDetails: Map<string, BundleDetails> = new Map();

  /** Keep track of how long a bundle takes to complete */
  _bundleTimers: Map<string, number> = new Map();

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
  shouldFilterClientLog(event: {
    type: 'client_log';
    level: 'trace' | 'info' | 'warn' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug';
    data: unknown[];
  }): boolean {
    return false;
  }

  /** Cache has been reset. */
  transformCacheReset(): void {}

  /** One of the first logs that will be printed. */
  dependencyGraphLoading(hasReducedPerformance: boolean): void {}

  /**
   * Custom log event representing the end of the bundling.
   *
   * @param event event object.
   * @param duration duration of the build in milliseconds.
   */
  bundleBuildEnded(event: TerminalReportableEvent, duration: number): void {}

  /**
   * This function is exclusively concerned with updating the internal state.
   * No logging or status updates should be done at this point.
   */
  _updateState(
    event: TerminalReportableEvent & { bundleDetails?: BundleDetails; buildID?: string }
  ) {
    // Append the buildID to the bundleDetails.
    if (event.bundleDetails) {
      event.bundleDetails.buildID = event.buildID;
    }

    super._updateState(event);
    switch (event.type) {
      case 'bundle_build_done':
      case 'bundle_build_failed': {
        const startTime = this._bundleTimers.get(event.buildID);
        // Observed a bug in Metro where the `bundle_build_done` is invoked twice during a static bundle
        // i.e. `expo export`.
        if (startTime == null) {
          break;
        }

        this.bundleBuildEnded(event, startTime ? Date.now() - startTime : 0);
        this._bundleTimers.delete(event.buildID);
        break;
      }
      case 'bundle_build_started':
        this._bundleDetails.set(event.buildID, event.bundleDetails);
        this._bundleTimers.set(event.buildID, Date.now());
        break;
    }
  }
}
