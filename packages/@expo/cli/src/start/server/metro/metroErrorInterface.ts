/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getMetroServerRoot } from '@expo/config/paths';
import { parseWebBuildErrors } from '@expo/log-box-utils';
import chalk from 'chalk';
import path from 'path';
import resolveFrom from 'resolve-from';
import type { StackFrame } from 'stacktrace-parser';
import { parse } from 'stacktrace-parser';

import { Log } from '../../../log';
import { stripAnsi } from '../../../utils/ansi';
import { env } from '../../../utils/env';
import { CommandError, SilentError } from '../../../utils/errors';
import { createMetroEndpointAsync } from '../getStaticRenderFunctions';
import { formatStack, likelyContainsCodeFrame } from './formatStack';
import type { LogBoxLogData } from './log-box/LogBoxLog';
import { LogBoxLog } from './log-box/LogBoxLog';
import type { CodeFrame, StackFrame as MetroStackFrame } from './log-box/LogBoxSymbolication';

const isDebug = env.EXPO_DEBUG;

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

  // Always show the full stack for build errors so Babel plugin and transformer bugs remain
  // debuggable. See https://github.com/expo/expo/pull/41468.
  Log.log(formatStack(projectRoot, { stack, codeFrame, error, showCollapsedFrames: true }).stack);
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

/** @returns the html required to render the static metro error as an SPA. */
function logFromError({ error, projectRoot }: { error: Error; projectRoot: string }): LogBoxLog {
  const data = parseWebBuildErrors({
    error,
    projectRoot,
    parseErrorStack,
  });
  return new LogBoxLog(data as LogBoxLogData);
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
  // Escape `<` so error contents like `</script>` cannot break out of the embedded JSON block.
  const serializedLogBox = JSON.stringify(logBoxContext).replace(/</g, '\\u003c');
  const html = `<html><head><style>#root,body,html{height:100%;background-color:black}body{overflow:hidden}#root{display:flex}</style></head><body><div id="root"></div><script id="_expo-static-error" type="application/json">${serializedLogBox}</script></body></html>`;

  // TODO: We could reuse the pre-built DOM Log Box from @expo/log-box
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

  const escapedSrc = errorOverlayEntry.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const htmlWithJs = html.replace('</body>', `<script src="${escapedSrc}"></script></body>`);
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

  return (
    parse(stack)
      .map((frame) => {
        // frame.file will mostly look like `http://localhost:8081/index.bundle?platform=web&dev=true&hot=false`

        if (frame.file) {
          // SSR will sometimes have absolute paths followed by `.bundle?...`, we need to try and make them relative paths and append a dev server URL.
          if (
            frame.file.startsWith('/') &&
            frame.file.includes('bundle?') &&
            !canParse(frame.file)
          ) {
            // Malformed stack file from SSR. Attempt to repair.
            frame.file = 'https://localhost:8081/' + path.relative(serverRoot, frame.file);
          }
        }

        return {
          ...frame,
          column: frame.column != null ? frame.column - 1 : null,
        };
      })
      // Keep dependency frames so formatStack can distinguish external callsites from collapsed
      // internals and render them dimmed instead of dropping them entirely.
      .filter((frame) => frame.file)
  );
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
 * Walks thru the error cause chain and attaches the import stack to the root error message.
 * Removes the error stack for import and syntax errors.
 */
export const attachImportStackToRootMessage = (
  err: unknown,
  importStack = nearestImportStack(err)
) => {
  // Space out build failures.
  if (err instanceof Error && importStack) {
    err.message += '\n\n' + importStack;
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
