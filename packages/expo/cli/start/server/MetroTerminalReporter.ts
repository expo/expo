import chalk from 'chalk';
import { Terminal } from 'metro-core';
import path from 'path';

import { learnMore } from '../../utils/link';
import {
  BuildPhase,
  BundleDetails,
  BundleProgress,
  logWarning,
  SnippetError,
  TerminalReporter,
} from './TerminalReporter';

/**
 * Extends the default Metro logger and adds some additional features.
 * Also removes the giant Metro logo from the output.
 */
export class MetroTerminalReporter extends TerminalReporter {
  constructor(public projectRoot: string, terminal: Terminal) {
    super(terminal);
  }
  /**
   * Extends the bundle progress to include the current platform that we're bundling.
   *
   * @returns `iOS BUNDLE path/to/bundle.js ▓▓▓▓▓░░░░░░░░░░░ 36.6% (4790/7922)`
   */
  _getBundleStatusMessage(progress: BundleProgress, phase: BuildPhase): string {
    const platform = getPlatformTagForBuildDetails(progress.bundleDetails);
    return platform + super._getBundleStatusMessage(progress, phase);
  }

  _logInitializing(port: number, hasReducedPerformance: boolean): void {
    // Noop -- don't print a giant logo
    this.terminal.log('Starting Metro Bundler');
  }

  protected shouldFilterClientLog(event: {
    type: 'client_log';
    level: 'trace' | 'info' | 'warn' | 'log' | 'group' | 'groupCollapsed' | 'groupEnd' | 'debug';
    data: unknown[];
  }): boolean {
    return isAppRegistryStartupMessage(event.data);
  }

  protected transformCacheReset(): void {
    logWarning(
      this.terminal,
      chalk`Bundler cache is empty, rebuilding {dim (this may take a minute)}`
    );
  }

  /** One of the first logs that will be printed */
  protected dependencyGraphLoading(hasReducedPerformance: boolean): void {
    // this.terminal.log('Dependency graph is loading...');
    if (hasReducedPerformance) {
      this.terminal.log(
        chalk.red(
          'Metro is operating with reduced performance.\n' +
            'Please fix the problem above and restart Metro.\n\n'
        )
      );
    }
  }

  _logBundlingError(error: SnippetError): void {
    const moduleResolutionError = formatUsingNodeStandardLibraryError(this.projectRoot, error);
    if (moduleResolutionError) {
      return this.terminal.log(maybeAppendCodeFrame(moduleResolutionError, error.message));
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
export function formatUsingNodeStandardLibraryError(projectRoot: string, error: SnippetError) {
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

  if (NODE_STDLIB_MODULES.includes(targetModuleName)) {
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
        `You attempted attempted to import the Node standard library module "${chalk.bold(
          targetModuleName
        )}" from "${chalk.bold(relativePath)}".`,
        `It failed because the native React runtime does not include the Node standard library.`,
        learnMore(DOCS_PAGE_URL),
      ].join('\n');
    }
  }
  return `Unable to resolve "${targetModuleName}" from "${relativePath}"`;
}

function maybeAppendCodeFrame(message: string, rawMessage: string): string {
  const codeFrame = stripMetroInfo(rawMessage);
  if (codeFrame) {
    message += '\n' + codeFrame;
  }
  return message;
}

export function stripMetroInfo(errorMessage: string): string {
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

function isAppRegistryStartupMessage(body: any[]): boolean {
  return (
    body.length === 1 &&
    (/^Running application "main" with appParams:/.test(body[0]) ||
      /^Running "main" with \{/.test(body[0]))
  );
}

// const { INTERNAL_CALLSITES_REGEX } = await import('@expo/metro-config');
// const logLines = (msg: any, logFn: (...args: any[]) => void) => {
//   if (typeof msg === 'string') {
//     for (const line of msg.split('\n')) {
//       logFn(line);
//     }
//   } else {
//     logFn(msg);
//   }
// };
// const logStackTrace = async (chunk: LogRecord, logFn: (...args: any[]) => void) => {
//   let traceInfo;
//   try {
//     traceInfo = JSON.parse(chunk.msg);
//   } catch (e) {
//     return logFn(chunk.msg);
//   }

//   const { message, stack } = traceInfo;
//   Log.log();
//   logFn(chalk.bold(message));

//   const isLibraryFrame = (line: string) => {
//     return line.startsWith('node_modules');
//   };

//   const stackFrames: string[] = stack.split('\n').filter((line: string) => line);
//   const lastAppCodeFrameIndex = findLastIndex(}Frames, (line) => {
//     return !isLibraryFrame(line);
//   });
//   let lastFrameIndexToLog = Math.min(
//     stackFrames.length - 1,
//     lastAppCodeFrameIndex + 2 // show max two more frames after last app code frame
//   );
//   let unloggedFrames = stackFrames.length - lastFrameIndexToLog;

//   // If we're only going to exclude one frame, just log them all
//   if (unloggedFrames === 1) {
//     lastFrameIndexToLog = stackFrames.length - 1;
//     unloggedFrames = 0;
//   }

//   for (let i = 0; i <= lastFrameIndexToLog; i++) {
//     const line = stackFrames[i];

//     if (!line) {
//       continue;
//     }

//     let isCollapsed = false;
//     const fileNameOrUrl = matchFileNameOrURLFromStackTrace(line);
//     if (fileNameOrUrl) {
//       // Use the same regex we use in Metro config to filter out traces:
//       isCollapsed = INTERNAL_CALLSITES_REGEX.test(fileNameOrUrl);

//       // Unless the user is in debug mode, skip printing the collapsed files.
//       if (!EXPO_DEBUG && isCollapsed) {
//         continue;
//       }
//     }

//     // If a file is collapsed, print it with dim styling.
//     const style = isCollapsed ? chalk.dim : (message: string) => message;
//     // Use the `at` prefix to match Node.js
//     logFn(style('at ' + line));
//   }

//   if (unloggedFrames > 0) {
//     logFn(`- ... ${unloggedFrames} more stack frames from framework internals`);
//   }

//   Log.log();
// };

function getPlatformTagForBuildDetails(bundleDetails?: BundleDetails | null) {
  const platform = bundleDetails?.platform ?? null;
  if (platform) {
    const formatted = { ios: 'iOS', android: 'Android', web: 'Web' }[platform] || platform;
    return `${chalk.bold(formatted)} `;
  }

  return '';
}

const NODE_STDLIB_MODULES = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
];
