/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getMetroServerRoot } from '@expo/config/paths';
import chalk from 'chalk';
import { stripVTControlCharacters } from 'node:util';
import path from 'path';
import resolveFrom from 'resolve-from';
import { parse, StackFrame } from 'stacktrace-parser';
import terminalLink from 'terminal-link';

import { LogBoxLog } from './log-box/LogBoxLog';
import type { CodeFrame, StackFrame as MetroStackFrame } from './log-box/LogBoxSymbolication';
import { getStackFormattedLocation } from './log-box/formatProjectFilePath';
import { Log } from '../../../log';
import { stripAnsi } from '../../../utils/ansi';
import { env } from '../../../utils/env';
import { CommandError, SilentError } from '../../../utils/errors';
import { createMetroEndpointAsync } from '../getStaticRenderFunctions';

const isDebug = require('debug').enabled('expo:start:server:metro');

function fill(width: number): string {
  return Array(width).join(' ');
}

function formatPaths(config: { filePath: string | null; line?: number; col?: number }) {
  const filePath = chalk.reset(config.filePath);
  return (
    chalk.dim('(') +
    filePath +
    chalk.dim(`:${[config.line, config.col].filter(Boolean).join(':')})`)
  );
}

export async function logMetroErrorWithStack(
  projectRoot: string,
  {
    stack,
    codeFrame,
    error,
  }: {
    stack: MetroStackFrame[];
    codeFrame?: CodeFrame;
    error: Error;
  }
) {
  if (error instanceof SilentError) {
    return;
  }

  // process.stdout.write('\u001b[0m'); // Reset attributes
  // process.stdout.write('\u001bc'); // Reset the terminal

  Log.log();
  Log.log(chalk.red('Metro error: ') + error.message);
  Log.log();

  if (error instanceof CommandError) {
    return;
  }

  Log.log(
    getStackAsFormattedLog(projectRoot, { stack, codeFrame, error, showCollapsedFrames: true })
      .stack
  );
}

export function getStackAsFormattedLog(
  projectRoot: string,
  {
    stack,
    codeFrame,
    error,
    showCollapsedFrames = env.EXPO_DEBUG,
  }: {
    stack: MetroStackFrame[];
    codeFrame?: CodeFrame;
    error?: Error;
    showCollapsedFrames?: boolean;
  }
): {
  isFallback: boolean;
  stack: string;
} {
  const logs: string[] = [];
  let hasCodeFramePresented = false;
  const containsCodeFrame = likelyContainsCodeFrame(error?.message);

  if (containsCodeFrame) {
    // Some transformation errors will have a code frame embedded in the error message
    // from Babel and we should not duplicate it as message is already printed before this call.
    hasCodeFramePresented = true;
  } else if (codeFrame) {
    const maxWarningLineLength = Math.max(800, process.stdout.columns);

    const lineText = codeFrame.content;
    const lines = codeFrame.content.split('\n');
    const cleanLines = lines.map((l) => stripVTControlCharacters(l).trim());

    // ---- index.tsx ------------------------------------------------------
    //  32 |         This is example code which will be under the title.
    const title = path.basename(codeFrame.fileName);
    const titlePadding = (cleanLines[0] || '').indexOf('|') + 2;
    const titleMaxLength =
      cleanLines.reduce((max, line) => Math.max(max, line.length), 0) - title.length;
    logs.push(
      chalk.gray(
        `${'-'.repeat(titlePadding)} ${chalk.bold(title)} ${'-'.repeat(Math.min(titleMaxLength, maxWarningLineLength))}`
      )
    );

    const isPreviewTooLong = lines.some((line) => line.length > maxWarningLineLength);
    const column = codeFrame.location?.column;
    // When the preview is too long, we skip reading the file and attempting to apply
    // code coloring, this is because it can get very slow.
    if (isPreviewTooLong) {
      let previewLine = '';
      let cursorLine = '';

      const formattedPath = formatPaths({
        filePath: codeFrame.fileName,
        line: codeFrame.location?.row,
        col: codeFrame.location?.column,
      });
      // Create a curtailed preview line like:
      // `...transition:'fade'},k._updatePropsStack=function(){clearImmediate(k._updateImmediate),k._updateImmediate...`
      // If there is no text preview or column number, we can't do anything.
      if (lineText && column != null) {
        const rangeWindow = Math.round(
          Math.max(codeFrame.fileName?.length ?? 0, Math.max(80, process.stdout.columns)) / 2
        );
        let minBounds = Math.max(0, column - rangeWindow);
        const maxBounds = Math.min(minBounds + rangeWindow * 2, lineText.length);
        previewLine = lineText.slice(minBounds, maxBounds);

        // If we splice content off the start, then we should append `...`.
        // This is unlikely to happen since we limit the activation size.
        if (minBounds > 0) {
          // Adjust the min bounds so the cursor is aligned after we add the "..."
          minBounds -= 3;
          previewLine = chalk.dim('...') + previewLine;
        }
        if (maxBounds < lineText.length) {
          previewLine += chalk.dim('...');
        }

        // If the column property could be found, then use that to fix the cursor location which is often broken in regex.
        cursorLine = (column == null ? '' : fill(column) + chalk.reset('^')).slice(minBounds);

        logs.push(formattedPath, '', previewLine, cursorLine, chalk.dim('(error truncated)'));
        hasCodeFramePresented = true;
      }
    } else {
      logs.push(codeFrame.content);
      hasCodeFramePresented = true;
    }
  }

  let isFallback = false;
  if (stack?.length) {
    const stackProps = stack.map((frame) => {
      return {
        title: frame.methodName,
        subtitle: getStackFormattedLocation(projectRoot, frame),
        collapse: frame.collapse,
      };
    });

    const stackLines: string[] = [];
    const backupStackLines: string[] = [];

    stackProps.forEach((frame) => {
      const shouldShow = !frame.collapse;

      const position = terminalLink.isSupported
        ? terminalLink(frame.subtitle, frame.subtitle)
        : frame.subtitle;
      let lineItem = chalk.gray(`  ${frame.title} (${position})`);

      if (frame.collapse) {
        lineItem = chalk.dim(lineItem);
      }
      // Never show the internal module system.
      const isMetroRuntime =
        /\/metro-runtime\/src\/polyfills\/require\.js/.test(frame.subtitle) ||
        /\/metro-require\/require\.js/.test(frame.subtitle);
      if (!isMetroRuntime) {
        if (shouldShow) {
          stackLines.push(lineItem);
        }
        backupStackLines.push(lineItem);
      }
    });

    if (hasCodeFramePresented) {
      logs.push('');
    }
    logs.push(chalk.bold`Call Stack`);

    if (!backupStackLines.length) {
      logs.push(chalk.gray('  No stack trace available.'));
    } else {
      isFallback = stackLines.length === 0;
      // If there are not stack lines then it means the error likely happened in the node modules, in this case we should fallback to showing all the
      // the stacks to give the user whatever help we can.
      const displayStack = stackLines.length ? stackLines : backupStackLines;
      logs.push(displayStack.join('\n'));
    }
  } else if (error && error.stack) {
    logs.push(chalk.gray(`  ${error.stack}`));
  }

  return {
    isFallback,
    stack: logs.join('\n'),
  };
}

export const IS_METRO_BUNDLE_ERROR_SYMBOL = Symbol('_isMetroBundleError');
const HAS_LOGGED_SYMBOL = Symbol('_hasLoggedInCLI');

export async function logMetroError(
  projectRoot: string,
  {
    error,
  }: {
    error: Error & {
      [HAS_LOGGED_SYMBOL]?: boolean;
    };
  }
) {
  if (error instanceof SilentError || error[HAS_LOGGED_SYMBOL]) {
    return;
  }
  error[HAS_LOGGED_SYMBOL] = true;

  const stack = parseErrorStack(projectRoot, error.stack);

  const log = new LogBoxLog({
    level: 'static',
    message: {
      content: error.message,
      substitutions: [],
    },
    isComponentError: false,
    stack,
    category: 'static',
    componentStack: [],
  });

  await new Promise((res) => log.symbolicate('stack', res));

  logMetroErrorWithStack(projectRoot, {
    stack: log.symbolicated?.stack?.stack ?? [],
    codeFrame: log.codeFrame,
    error,
  });
}

function isTransformError(
  error: any
): error is { type: 'TransformError'; filename: string; lineNumber: number; column: number } {
  return error.type === 'TransformError';
}

/** @returns the html required to render the static metro error as an SPA. */
function logFromError({ error, projectRoot }: { error: Error; projectRoot: string }) {
  // Remap direct Metro Node.js errors to a format that will appear more client-friendly in the logbox UI.
  let stack: MetroStackFrame[] | undefined;
  if (isTransformError(error) && error.filename) {
    // Syntax errors in static rendering.
    stack = [
      {
        file: path.join(projectRoot, error.filename),
        methodName: '<unknown>',
        arguments: [],
        // TODO: Import stack
        lineNumber: error.lineNumber,
        column: error.column,
      },
    ];
  } else if ('originModulePath' in error && typeof error.originModulePath === 'string') {
    // TODO: Use import stack here when the error is resolution based.
    stack = [
      {
        file: error.originModulePath,
        methodName: '<unknown>',
        arguments: [],
        // TODO: Import stack
        lineNumber: 0,
        column: 0,
      },
    ];
  } else {
    stack = parseErrorStack(projectRoot, error.stack);
  }

  return new LogBoxLog({
    level: 'static',
    message: {
      content: error.message,
      substitutions: [],
    },
    isComponentError: false,
    stack,
    category: 'static',
    componentStack: [],
  });
}

/** @returns the html required to render the static metro error as an SPA. */
export async function logMetroErrorAsync({
  error,
  projectRoot,
}: {
  error: Error;
  projectRoot: string;
}) {
  const log = logFromError({ projectRoot, error });

  await new Promise<void>((res) => log.symbolicate('stack', () => res()));

  logMetroErrorWithStack(projectRoot, {
    stack: log.symbolicated?.stack?.stack ?? [],
    codeFrame: log.codeFrame,
    error,
  });
}

/** @returns the html required to render the static metro error as an SPA. */
export async function getErrorOverlayHtmlAsync({
  error,
  projectRoot,
  routerRoot,
}: {
  error: Error;
  projectRoot: string;
  routerRoot: string;
}) {
  const log = logFromError({ projectRoot, error });

  await new Promise<void>((res) => log.symbolicate('stack', () => res()));

  logMetroErrorWithStack(projectRoot, {
    stack: log.symbolicated?.stack?.stack ?? [],
    codeFrame: log.codeFrame,
    error,
  });

  if ('message' in log && 'content' in log.message && typeof log.message.content === 'string') {
    log.message.content = stripAnsi(log.message.content)!;
  }

  const logBoxContext = {
    selectedLogIndex: 0,
    isDisabled: false,
    logs: [log],
  };
  const html = `<html><head><style>#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}</style></head><body><div id="root"></div><script id="_expo-static-error" type="application/json">${JSON.stringify(
    logBoxContext
  )}</script></body></html>`;

  const errorOverlayEntry = await createMetroEndpointAsync(
    projectRoot,
    // Keep the URL relative
    '',
    resolveFrom(projectRoot, 'expo-router/_error'),
    {
      mode: 'development',
      platform: 'web',
      minify: false,
      optimize: false,
      usedExports: false,
      baseUrl: '',
      routerRoot,
      isExporting: false,
      reactCompiler: false,
    }
  );

  const htmlWithJs = html.replace('</body>', `<script src=${errorOverlayEntry}></script></body>`);
  return htmlWithJs;
}

function parseErrorStack(
  projectRoot: string,
  stack?: string
): (StackFrame & { collapse?: boolean })[] {
  if (stack == null) {
    return [];
  }
  if (Array.isArray(stack)) {
    return stack;
  }

  const serverRoot = getMetroServerRoot(projectRoot);

  return parse(stack)
    .map((frame) => {
      // frame.file will mostly look like `http://localhost:8081/index.bundle?platform=web&dev=true&hot=false`

      if (frame.file) {
        // SSR will sometimes have absolute paths followed by `.bundle?...`, we need to try and make them relative paths and append a dev server URL.
        if (frame.file.startsWith('/') && frame.file.includes('bundle?') && !canParse(frame.file)) {
          // Malformed stack file from SSR. Attempt to repair.
          frame.file = 'https://localhost:8081/' + path.relative(serverRoot, frame.file);
        }
      }

      return {
        ...frame,
        column: frame.column != null ? frame.column - 1 : null,
      };
    })
    .filter((frame) => frame.file && !frame.file.includes('node_modules'));
}

function canParse(url: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function dropStackIfContainsCodeFrame(err: unknown) {
  if (!(err instanceof Error)) return;

  if (likelyContainsCodeFrame(err.message)) {
    // If the error message contains a code frame, we should drop the stack to avoid cluttering the output.
    delete err.stack;
  }
}

/**
 * Tests given string on presence of ` [num] |` at the start of any line.
 * Returns `false` for undefined or empty strings.
 */
export function likelyContainsCodeFrame(message: string | undefined): boolean {
  if (!message) return false;

  const clean = stripVTControlCharacters(message);
  if (!clean) return false;

  return /^\s*\d+\s+\|/m.test(clean);
}

/**
 * Walks thru the error cause chain and attaches the import stack to the root error message.
 * Removes the error stack for import and syntax errors.
 */
export const attachImportStackToRootMessage = (err: unknown) => {
  if (!(err instanceof Error)) return;

  // Space out build failures.
  const nearestImportStackValue = nearestImportStack(err);
  if (nearestImportStackValue) {
    err.message += '\n\n' + nearestImportStackValue;

    if (!isDebug) {
      // When not debugging remove the stack to avoid cluttering the output and confusing users,
      // the import stack is the guide to fixing the error.
      delete err.stack;
    }
  }
};

/**
 * Walks thru the error cause chain and returns the nearest import stack.
 * If the import stack is not found, it returns `undefined`.
 */
export const nearestImportStack = (err: unknown, root: unknown = err): string | undefined => {
  if (!(err instanceof Error) || !(root instanceof Error)) return undefined;

  if ('_expoImportStack' in err && typeof err._expoImportStack === 'string') {
    // Space out build failures.
    return err._expoImportStack;
  } else {
    return nearestImportStack(err.cause, root);
  }
};
