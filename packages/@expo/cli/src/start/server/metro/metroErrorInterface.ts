/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';
import resolveFrom from 'resolve-from';
import { StackFrame } from 'stacktrace-parser';
import terminalLink from 'terminal-link';
import { URL } from 'url';

import { Log } from '../../../log';
import { memoize } from '../../../utils/fn';
import { createMetroEndpointAsync } from '../getStaticRenderFunctions';
// import type { CodeFrame, MetroStackFrame } from '@expo/metro-runtime/symbolicate';

type CodeFrame = {
  content: string;
  location?: {
    row: number;
    column: number;
    [key: string]: any;
  };
  fileName: string;
};

type MetroStackFrame = StackFrame & { collapse?: boolean };

export async function logMetroErrorWithStack(
  projectRoot: string,
  {
    stack,
    codeFrame,
    error,
  }: {
    stack: MetroStackFrame[];
    codeFrame: CodeFrame;
    error: Error;
  }
) {
  Log.log();
  Log.log(chalk.red('Metro error: ') + error.message);
  Log.log();

  Log.log(getMetroStackAsLogString(projectRoot, { stack, codeFrame, error }));
}

export function getMetroStackAsLogString(
  projectRoot: string,
  {
    stack,
    codeFrame,
    error,
  }: {
    stack: MetroStackFrame[];
    codeFrame: CodeFrame;
    error?: Error;
  }
) {
  const { getStackFormattedLocation } = require(resolveFrom(
    projectRoot,
    '@expo/metro-runtime/symbolicate'
  ));

  let str = '';

  if (codeFrame) {
    str += codeFrame.content + '\n';
    // Log.log(codeFrame.content);
  }

  if (stack?.length) {
    str += '\n';
    str += chalk.bold`Call Stack\n`;

    const stackProps = stack.map((frame) => {
      return {
        title: frame.methodName,
        subtitle: getStackFormattedLocation(projectRoot, frame),
        collapse: frame.collapse,
      };
    });

    const includeCollapsed = stackProps.every((frame) => frame.collapse);

    stackProps.forEach((frame) => {
      const position = terminalLink.isSupported
        ? terminalLink(frame.subtitle, frame.subtitle)
        : frame.subtitle;
      let lineItem = chalk.gray(`  ${frame.title} (${position})`);
      if (frame.collapse) {
        lineItem = chalk.dim(lineItem);
      }
      if (includeCollapsed || !frame.collapse) {
        str += lineItem + '\n';
      }
    });
  } else if (error) {
    str += chalk.gray(`  ${error.stack}`);
  }
  return str;
}

function getSymbolicateImport(projectRoot: string) {
  return resolveFrom.silent(projectRoot, '@expo/metro-runtime/symbolicate');
}

const getSymbolicateImportMemo = memoize(getSymbolicateImport);

export async function getSymbolicatedMetroStackAsync(
  projectRoot: string,
  errorFragment: { message: string; stack: string }
): Promise<null | {
  stack: MetroStackFrame[];
  codeFrame: CodeFrame;
}> {
  const moduleId = getSymbolicateImportMemo(projectRoot);
  if (!moduleId) {
    return null;
  }

  const { LogBoxLog, parseErrorStack } = require(moduleId);

  const stack = parseErrorStack(errorFragment.stack);

  // Required for symbolication in `@expo/metro-runtime`:
  if (!process.env.EXPO_DEV_SERVER_ORIGIN) {
    // Find the first stack trace with a URL for the file.
    const firstStack = stack.find((stack) => stack.file?.match(/^https?:\/\//));
    if (firstStack) {
      const baseUrl = new URL(firstStack.file);
      // Set the URL so we can symbolicate from the server.
      Log.debug('Setting base URL based on stack:', baseUrl.origin);
      process.env.EXPO_DEV_SERVER_ORIGIN = baseUrl.origin;
    }
  }

  const log = new LogBoxLog({
    // TODO: Unclear if these could be more correct...
    level: 'warn',
    message: {
      content: errorFragment.message,
      substitutions: [],
    },
    isComponentError: true,
    stack: [],
    category: 'static',
    componentStack: stack.map((frame) => {
      return {
        fileName: frame.file,
        content: frame.methodName,
        location: {
          row: frame.lineNumber,
          column: frame.column,
        },
      };
    }),
  });

  await new Promise((res) => log.symbolicate('component', res));

  if (log.symbolicated?.component?.error) {
    Log.log('Failed to symbolicate Metro stack:', log.symbolicated?.component?.error);
    return null;
  }
  console.log('f', stack, log.symbolicated?.component);
  return {
    stack: log.symbolicated?.component?.stack ?? [],
    codeFrame: log.codeFrame,
  };
}

export async function logMetroError(projectRoot: string, { error }: { error: Error }) {
  const { LogBoxLog, parseErrorStack } = require(resolveFrom(
    projectRoot,
    '@expo/metro-runtime/symbolicate'
  ));

  const stack = parseErrorStack(error.stack);

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
export function logFromError({ error, projectRoot }: { error: Error; projectRoot: string }): {
  symbolicated: any;
  symbolicate: (type: string, callback: () => void) => void;
  codeFrame: CodeFrame;
} {
  const { LogBoxLog, parseErrorStack } = require(resolveFrom(
    projectRoot,
    '@expo/metro-runtime/symbolicate'
  ));

  const stack = parseErrorStack(error.stack);

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

  await new Promise<void>((res) => log.symbolicate('stack', res));

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
}: {
  error: Error;
  projectRoot: string;
}) {
  const log = logFromError({ projectRoot, error });

  await new Promise<void>((res) => log.symbolicate('stack', res));

  logMetroErrorWithStack(projectRoot, {
    stack: log.symbolicated?.stack?.stack ?? [],
    codeFrame: log.codeFrame,
    error,
  });

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
      dev: true,
      platform: 'web',
      minify: false,
      environment: 'node',
    }
  );

  const htmlWithJs = html.replace('</body>', `<script src=${errorOverlayEntry}></script></body>`);
  return htmlWithJs;
}
