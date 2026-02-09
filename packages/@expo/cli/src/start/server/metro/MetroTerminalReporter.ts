import type { Terminal } from '@expo/metro/metro-core';
import chalk from 'chalk';
import path from 'path';
import { stripVTControlCharacters } from 'util';

import { logWarning, TerminalReporter } from './TerminalReporter';
import {
  BuildPhase,
  BundleDetails,
  BundleProgress,
  SnippetError,
  TerminalReportableEvent,
} from './TerminalReporter.types';
import { NODE_STDLIB_MODULES } from './externals';
import { env } from '../../../utils/env';
import { learnMore } from '../../../utils/link';
import {
  logLikeMetro,
  maybeSymbolicateAndFormatJSErrorStackLogAsync,
  parseErrorStringToObject,
} from '../serverLogLikeMetro';
import { attachImportStackToRootMessage, nearestImportStack } from './metroErrorInterface';
import { events } from '../../../events';

const debug = require('debug')('expo:metro:logger') as typeof console.log;

// prettier-ignore
export const event = events('metro', (t) => [
  t.event<'bundling:started', {
    id: string;
    platform: null | string;
    environment: null | string;
    entry: string;
  }>(),
  t.event<'bundling:done', {
    id: string | null;
    ms: number | null;
    total: number;
  }>(),
  t.event<'bundling:failed', {
    id: string | null;
    filename: string | null;
    message: string | null;
    targetModuleName: string | null;
    originModulePath: string | null;
  }>(),
  t.event<'bundling:progress', {
    id: string | null;
    progress: number;
    current: number;
    total: number;
  }>(),
  t.event<'server_log', {
    level: 'info' | 'warn' | 'error' | null;
    data: string | unknown[] | null;
  }>(),
  t.event<'client_log', {
    level: 'trace' | 'info' | 'warn' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug' | null;
    data: unknown[] | null;
  }>(),
  t.event<'hmr_client_error', {
    message: string;
  }>(),
  t.event<'cache_write_error', {
    message: string;
  }>(),
  t.event<'cache_read_error', {
    message: string;
  }>(),
]);

const MAX_PROGRESS_BAR_CHAR_WIDTH = 16;
const DARK_BLOCK_CHAR = '\u2593';
const LIGHT_BLOCK_CHAR = '\u2591';
/**
 * Extends the default Metro logger and adds some additional features.
 * Also removes the giant Metro logo from the output.
 */
export class MetroTerminalReporter extends TerminalReporter {
  #lastFailedBuildID: string | undefined;

  constructor(
    public projectRoot: string,
    terminal: Terminal
  ) {
    super(terminal);
  }

  _log(event: TerminalReportableEvent): void {
    this.#captureLog(event);
    switch (event.type) {
      case 'unstable_server_log':
        if (typeof event.data?.[0] === 'string') {
          const message = event.data[0];
          if (message.match(/JavaScript logs have moved/)) {
            // Hide this very loud message from upstream React Native in favor of the note in the terminal UI:
            // The "› Press j │ open debugger"

            // logger?.info(
            //   '\u001B[1m\u001B[7m💡 JavaScript logs have moved!\u001B[22m They can now be ' +
            //     'viewed in React Native DevTools. Tip: Type \u001B[1mj\u001B[22m in ' +
            //     'the terminal to open (requires Google Chrome or Microsoft Edge).' +
            //     '\u001B[27m',
            // );
            return;
          }

          if (!env.EXPO_DEBUG) {
            // In the context of developing an iOS app or website, the MetroInspectorProxy "connection" logs are very confusing.
            // Here we'll hide them behind EXPO_DEBUG or DEBUG=expo:*. In the future we can reformat them to clearly indicate that the "Connection" is regarding the debugger.
            // These logs are also confusing because they can say "connection established" even when the debugger is not in a usable state. Really they belong in a UI or behind some sort of debug logging.
            if (message.match(/Connection (closed|established|failed|terminated)/i)) {
              // Skip logging.
              return;
            }
          }
        }
        break;
      case 'client_log': {
        if (this.shouldFilterClientLog(event)) {
          return;
        }
        const { level } = event;

        if (!level) {
          break;
        }

        if (level === 'warn' || (level as string) === 'error') {
          let hasStack = false;
          const parsed = event.data.map((msg) => {
            // Quick check to see if an unsymbolicated stack is being logged.
            if (msg.includes('.bundle//&platform=')) {
              const stack = parseErrorStringToObject(msg);
              if (stack) {
                hasStack = true;
              }
              return stack;
            }
            return msg;
          });

          if (hasStack) {
            (async () => {
              const symbolicating = parsed.map((p) => {
                if (typeof p === 'string') return p;
                return maybeSymbolicateAndFormatJSErrorStackLogAsync(this.projectRoot, level, p);
              });

              let usefulStackCount = 0;
              const fallbackIndices: number[] = [];
              const symbolicated = (await Promise.allSettled(symbolicating)).map((s, index) => {
                if (s.status === 'rejected') {
                  debug('Error formatting stack', parsed[index], s.reason);
                  return parsed[index];
                } else if (typeof s.value === 'string') {
                  return s.value;
                } else {
                  if (!s.value.isFallback) {
                    usefulStackCount++;
                  } else {
                    fallbackIndices.push(index);
                  }
                  return s.value.stack;
                }
              });

              // Using EXPO_DEBUG we can print all stack
              const filtered =
                usefulStackCount && !env.EXPO_DEBUG
                  ? symbolicated.filter((_, index) => !fallbackIndices.includes(index))
                  : symbolicated;

              logLikeMetro(this.terminal.log.bind(this.terminal), level, null, ...filtered);
            })();
            return;
          }
        }

        // Overwrite the Metro terminal logging so we can improve the warnings, symbolicate stacks, and inject extra info.
        logLikeMetro(this.terminal.log.bind(this.terminal), level, null, ...event.data);
        return;
      }
    }
    return super._log(event);
  }

  // Used for testing
  _getElapsedTime(startTime: bigint): bigint {
    return process.hrtime.bigint() - startTime;
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

    let localPath: string;

    if (
      typeof progress.bundleDetails?.customTransformOptions?.dom === 'string' &&
      progress.bundleDetails.customTransformOptions.dom.includes(path.sep)
    ) {
      // Because we use a generated entry file for DOM components, we need to adjust the logging path so it
      // shows a unique path for each component.
      // Here, we take the relative import path and remove all the starting slashes.
      localPath = progress.bundleDetails.customTransformOptions.dom.replace(/^(\.?\.[\\/])+/, '');
    } else {
      const inputFile = progress.bundleDetails.entryFile;

      localPath = path.isAbsolute(inputFile)
        ? path.relative(this.projectRoot, inputFile)
        : inputFile;
    }

    if (!inProgress) {
      const status = phase === 'done' ? `Bundled ` : `Bundling failed `;
      const color = phase === 'done' ? chalk.green : chalk.red;

      const startTime = this._bundleTimers.get(progress.bundleDetails.buildID!);

      let time: string = '';
      let ms: number | null = null;

      if (startTime != null) {
        const elapsed: bigint = this._getElapsedTime(startTime);
        const micro = Number(elapsed) / 1000;
        ms = Number(elapsed) / 1e6;
        // If the milliseconds are < 0.5 then it will display as 0, so we display in microseconds.
        if (ms <= 0.5) {
          const tenthFractionOfMicro = ((micro * 10) / 1000).toFixed(0);
          // Format as microseconds to nearest tenth
          time = chalk.cyan.bold(`0.${tenthFractionOfMicro}ms`);
        } else {
          time = chalk.dim(ms.toFixed(0) + 'ms');
        }
      }

      if (phase === 'done') {
        event('bundling:done', {
          id: progress.bundleDetails.buildID ?? null,
          total: progress.totalFileCount,
          ms,
        });
      }

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

    event('bundling:progress', {
      id: progress.bundleDetails.buildID ?? null,
      progress: progress.ratio,
      total: progress.totalFileCount,
      current: progress.transformedFileCount,
    });

    return (
      platform +
      chalk.reset.dim(`${path.dirname(localPath)}${path.sep}`) +
      chalk.bold(path.basename(localPath)) +
      ' ' +
      _progress
    );
  }

  _logInitializing(port: number, hasReducedPerformance: boolean): void {
    // Don't print a giant logo...
    this.terminal.log(chalk.dim('Starting Metro Bundler') + '\n');
  }

  shouldFilterClientLog(event: { type: 'client_log'; data: unknown[] }): boolean {
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
            'Fix the problem above and restart Metro.',
          ].join('\n')
        )
      );
    }
  }

  /**
   * Workaround to link build ids to bundling errors.
   * This works because `_logBundleBuildFailed` is called before `_logBundlingError` in synchronous manner.
   * https://github.com/facebook/metro/blob/main/packages/metro/src/Server.js#L939-L945
   */
  _logBundleBuildFailed(buildID: string): void {
    this.#lastFailedBuildID = buildID;
    super._logBundleBuildFailed(buildID);
  }

  _logBundlingError(error: SnippetError): void {
    event('bundling:failed', {
      id: this.#lastFailedBuildID ?? null,
      message: error.message ?? null,
      filename: error.filename ?? null,
      targetModuleName: error.targetModuleName ?? null,
      originModulePath: error.originModulePath ?? null,
    });

    const moduleResolutionError = formatUsingNodeStandardLibraryError(this.projectRoot, error);
    if (moduleResolutionError) {
      let message = maybeAppendCodeFrame(moduleResolutionError, error.message);
      message += '\n\n' + nearestImportStack(error);
      return this.terminal.log(message);
    }

    attachImportStackToRootMessage(error);

    // NOTE(@kitten): Metro drops the stack forcefully when it finds a `SyntaxError`. However,
    // this is really unhelpful, since it prevents debugging Babel plugins or reporting bugs
    // in Babel plugins or a transformer entirely
    if (error.snippet == null && error.stack != null && error instanceof SyntaxError) {
      error.message = error.stack;
      delete error.stack;
    }

    return super._logBundlingError(error);
  }

  #captureLog(evt: TerminalReportableEvent) {
    switch (evt.type) {
      case 'bundle_build_started':
        return event('bundling:started', {
          id: evt.buildID,
          platform: evt.bundleDetails.platform ?? null,
          environment: evt.bundleDetails.customTransformOptions?.environment ?? null,
          entry: evt.bundleDetails.entryFile,
        });
      case 'unstable_server_log':
        return event('server_log', {
          level: evt.level ?? null,
          data: evt.data ?? null,
        });
      case 'client_log':
        return event('client_log', {
          level: evt.level ?? null,
          data: evt.data ?? null,
        });
      case 'hmr_client_error':
      case 'cache_write_error':
      case 'cache_read_error':
        return event(evt.type, {
          message: evt.error.message,
        });
    }
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
  const codeFrame = extractCodeFrame(stripMetroInfo(rawMessage));
  if (codeFrame) {
    message += '\n' + codeFrame;
  }
  return message;
}

/** Extract fist code frame presented in the error message */
export function extractCodeFrame(errorMessage: string): string {
  const codeFrameLine = /^(?:\s*(?:>?\s*\d+\s*\||\s*\|).*\n?)+/;
  let wasPreviousLineCodeFrame: boolean | null = null;
  return errorMessage
    .split('\n')
    .filter((line) => {
      if (wasPreviousLineCodeFrame === false) return false;
      const keep = codeFrameLine.test(stripVTControlCharacters(line));
      if (keep && wasPreviousLineCodeFrame === null) wasPreviousLineCodeFrame = true;
      else if (!keep && wasPreviousLineCodeFrame) wasPreviousLineCodeFrame = false;
      return keep;
    })
    .join('\n');
}

/**
 * Remove the Metro cache clearing steps if they exist.
 * In future versions we won't need this.
 * Returns the remaining code frame logs.
 */
export function stripMetroInfo(errorMessage: string): string {
  // Newer versions of Metro don't include the list.
  if (!errorMessage.includes('4. Remove the cache')) {
    return errorMessage;
  }
  const lines = errorMessage.split('\n');
  const index = lines.findIndex((line) => line.includes('4. Remove the cache'));
  if (index === -1) {
    return errorMessage;
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

  if (
    bundleDetails?.customTransformOptions?.dom &&
    typeof bundleDetails?.customTransformOptions?.dom === 'string'
  ) {
    return chalk.bold(`DOM`) + ' ';
  }

  return '';
}
