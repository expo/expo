import chalk from 'chalk';
import { Terminal } from 'metro-core';
import path from 'path';

import { logWarning, TerminalReporter } from './TerminalReporter';
import {
  BuildPhase,
  BundleDetails,
  BundleProgress,
  SnippetError,
  TerminalReportableEvent,
} from './TerminalReporter.types';
import { NODE_STDLIB_MODULES } from './externals';
import { learnMore } from '../../../utils/link';

const MAX_PROGRESS_BAR_CHAR_WIDTH = 16;
const DARK_BLOCK_CHAR = '\u2593';
const LIGHT_BLOCK_CHAR = '\u2591';
/**
 * Extends the default Metro logger and adds some additional features.
 * Also removes the giant Metro logo from the output.
 */
export class MetroTerminalReporter extends TerminalReporter {
  constructor(
    public projectRoot: string,
    terminal: Terminal
  ) {
    super(terminal);
  }

  // Used for testing
  _getElapsedTime(startTime: number): number {
    return Date.now() - startTime;
  }
  /**
   * Extends the bundle progress to include the current platform that we're bundling.
   *
   * @returns `iOS path/to/bundle.js ▓▓▓▓▓░░░░░░░░░░░ 36.6% (4790/7922)`
   */
  _getBundleStatusMessage(progress: BundleProgress, phase: BuildPhase): string {
    const env = getEnvironmentForBuildDetails(progress.bundleDetails);
    const platform = env || getPlatformTagForBuildDetails(progress.bundleDetails);
    const inProgress = phase === 'in_progress';

    const localPath = progress.bundleDetails.entryFile.startsWith(path.sep)
      ? path.relative(this.projectRoot, progress.bundleDetails.entryFile)
      : progress.bundleDetails.entryFile;

    if (!inProgress) {
      const status = phase === 'done' ? `Bundled ` : `Bundling failed `;
      const color = phase === 'done' ? chalk.green : chalk.red;

      const startTime = this._bundleTimers.get(progress.bundleDetails.buildID!);

      const time = startTime != null ? chalk.dim(this._getElapsedTime(startTime) + 'ms') : '';
      // iOS Bundled 150ms
      const plural = progress.totalFileCount === 1 ? '' : 's';
      return (
        color(platform + status) +
        time +
        chalk.reset.dim(` ${localPath} (${progress.totalFileCount} module${plural})`)
      );
    }

    const filledBar = Math.floor(progress.ratio * MAX_PROGRESS_BAR_CHAR_WIDTH);

    const _progress = inProgress
      ? chalk.green.bgGreen(DARK_BLOCK_CHAR.repeat(filledBar)) +
        chalk.bgWhite.white(LIGHT_BLOCK_CHAR.repeat(MAX_PROGRESS_BAR_CHAR_WIDTH - filledBar)) +
        chalk.bold(` ${(100 * progress.ratio).toFixed(1).padStart(4)}% `) +
        chalk.dim(
          `(${progress.transformedFileCount
            .toString()
            .padStart(progress.totalFileCount.toString().length)}/${progress.totalFileCount})`
        )
      : '';

    return (
      platform +
      chalk.reset.dim(`${path.dirname(localPath)}/`) +
      chalk.bold(path.basename(localPath)) +
      ' ' +
      _progress
    );
  }

  _logInitializing(port: number, hasReducedPerformance: boolean): void {
    // Don't print a giant logo...
    this.terminal.log('Starting Metro Bundler');
  }

  shouldFilterClientLog(event: {
    type: 'client_log';
    level: 'trace' | 'info' | 'warn' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug';
    data: unknown[];
  }): boolean {
    return isAppRegistryStartupMessage(event.data);
  }

  shouldFilterBundleEvent(event: TerminalReportableEvent): boolean {
    return 'bundleDetails' in event && event.bundleDetails?.bundleType === 'map';
  }

  /** Print the cache clear message. */
  transformCacheReset(): void {
    logWarning(
      this.terminal,
      chalk`Bundler cache is empty, rebuilding {dim (this may take a minute)}`
    );
  }

  /** One of the first logs that will be printed */
  dependencyGraphLoading(hasReducedPerformance: boolean): void {
    // this.terminal.log('Dependency graph is loading...');
    if (hasReducedPerformance) {
      // Extends https://github.com/facebook/metro/blob/347b1d7ed87995d7951aaa9fd597c04b06013dac/packages/metro/src/lib/TerminalReporter.js#L283-L290
      this.terminal.log(
        chalk.red(
          [
            'Metro is operating with reduced performance.',
            'Please fix the problem above and restart Metro.',
          ].join('\n')
        )
      );
    }
  }

  _logBundlingError(error: SnippetError): void {
    const moduleResolutionError = formatUsingNodeStandardLibraryError(this.projectRoot, error);
    const cause = error.cause as undefined | { _expoImportStack?: string };
    if (moduleResolutionError) {
      let message = maybeAppendCodeFrame(moduleResolutionError, error.message);
      if (cause?._expoImportStack) {
        message += `\n\n${cause?._expoImportStack}`;
      }
      return this.terminal.log(message);
    }
    if (cause?._expoImportStack) {
      error.message += `\n\n${cause._expoImportStack}`;
    }
    return super._logBundlingError(error);
  }
}

/**
 * Formats an error where the user is attempting to import a module from the Node.js standard library.
 * Exposed for testing.
 *
 * @param error
 * @returns error message or null if not a module resolution error
 */
export function formatUsingNodeStandardLibraryError(
  projectRoot: string,
  error: SnippetError
): string | null {
  if (!error.message) {
    return null;
  }
  const { targetModuleName, originModulePath } = error;
  if (!targetModuleName || !originModulePath) {
    return null;
  }
  const relativePath = path.relative(projectRoot, originModulePath);

  const DOCS_PAGE_URL =
    'https://docs.expo.dev/workflow/using-libraries/#using-third-party-libraries';

  if (isNodeStdLibraryModule(targetModuleName)) {
    if (originModulePath.includes('node_modules')) {
      return [
        `The package at "${chalk.bold(
          relativePath
        )}" attempted to import the Node standard library module "${chalk.bold(
          targetModuleName
        )}".`,
        `It failed because the native React runtime does not include the Node standard library.`,
        learnMore(DOCS_PAGE_URL),
      ].join('\n');
    } else {
      return [
        `You attempted to import the Node standard library module "${chalk.bold(
          targetModuleName
        )}" from "${chalk.bold(relativePath)}".`,
        `It failed because the native React runtime does not include the Node standard library.`,
        learnMore(DOCS_PAGE_URL),
      ].join('\n');
    }
  }
  return `Unable to resolve "${targetModuleName}" from "${relativePath}"`;
}

export function isNodeStdLibraryModule(moduleName: string): boolean {
  return /^node:/.test(moduleName) || NODE_STDLIB_MODULES.includes(moduleName);
}

/** If the code frame can be found then append it to the existing message.  */
function maybeAppendCodeFrame(message: string, rawMessage: string): string {
  const codeFrame = stripMetroInfo(rawMessage);
  if (codeFrame) {
    message += '\n' + codeFrame;
  }
  return message;
}

/**
 * Remove the Metro cache clearing steps if they exist.
 * In future versions we won't need this.
 * Returns the remaining code frame logs.
 */
export function stripMetroInfo(errorMessage: string): string | null {
  // Newer versions of Metro don't include the list.
  if (!errorMessage.includes('4. Remove the cache')) {
    return null;
  }
  const lines = errorMessage.split('\n');
  const index = lines.findIndex((line) => line.includes('4. Remove the cache'));
  if (index === -1) {
    return null;
  }
  return lines.slice(index + 1).join('\n');
}

/** @returns if the message matches the initial startup log */
function isAppRegistryStartupMessage(body: any[]): boolean {
  return (
    body.length === 1 &&
    (/^Running application "main" with appParams:/.test(body[0]) ||
      /^Running "main" with \{/.test(body[0]))
  );
}

/** @returns platform specific tag for a `BundleDetails` object */
function getPlatformTagForBuildDetails(bundleDetails?: BundleDetails | null): string {
  const platform = bundleDetails?.platform ?? null;
  if (platform) {
    const formatted = { ios: 'iOS', android: 'Android', web: 'Web' }[platform] || platform;
    return `${chalk.bold(formatted)} `;
  }

  return '';
}
/** @returns platform specific tag for a `BundleDetails` object */
function getEnvironmentForBuildDetails(bundleDetails?: BundleDetails | null): string {
  // Expo CLI will pass `customTransformOptions.environment = 'node'` when bundling for the server.
  const env = bundleDetails?.customTransformOptions?.environment ?? null;
  if (env === 'node') {
    return chalk.bold('λ') + ' ';
  } else if (env === 'react-server') {
    return chalk.bold(`RSC(${getPlatformTagForBuildDetails(bundleDetails).trim()})`) + ' ';
  }

  return '';
}
