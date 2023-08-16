/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import chalk from 'chalk';
import path from 'node:path';
import resolveFrom from 'resolve-from';
import { StackFrame } from 'stacktrace-parser';
import terminalLink from 'terminal-link';

import { Log } from '../../../log';
import { stripAnsi } from '../../../utils/ansi';
import { createSafeMetroEndpointAsync } from '../createSafeMetroEndpoint';
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

interface MetroPackageResolutionError extends Error {
  originModulePath: string;
  targetModuleName: string;
}

interface MetroTransformError extends Error {
  type: 'TransformError';
  snippet?: string;
  lineNumber: number;
  column: number;
  filename: string;
}

function isMetroTransformError(value: any): value is MetroTransformError {
  return value && value?.type === 'TransformError';
}

function isMetroPackageResolutionError(value: any): value is MetroPackageResolutionError {
  return value && 'targetModuleName' in value;
}

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
  const { getStackFormattedLocation } = require(resolveFrom(
    projectRoot,
    '@expo/metro-runtime/symbolicate'
  ));

  Log.log();
  Log.log(chalk.red('Metro error: ') + error.message);
  Log.log();

  if (codeFrame) {
    Log.log(codeFrame.content);
  }

  if (stack?.length) {
    Log.log();
    Log.log(chalk.bold`Call Stack`);

    const stackProps = stack.map((frame) => {
      return {
        title: frame.methodName,
        subtitle: getStackFormattedLocation(projectRoot, frame),
        collapse: frame.collapse,
      };
    });

    stackProps.forEach((frame) => {
      const position = terminalLink.isSupported
        ? terminalLink(frame.subtitle, frame.subtitle)
        : frame.subtitle;
      let lineItem = chalk.gray(`  ${frame.title} (${position})`);
      if (frame.collapse) {
        lineItem = chalk.dim(lineItem);
      }
      Log.log(lineItem);
    });
  } else {
    Log.log(chalk.gray(`  ${error.stack}`));
  }
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

  let stack = parseErrorStack(error.stack);

  if (isMetroTransformError(error)) {
    // type: 'TransformError',
    // snippet: undefined,
    // lineNumber: 4,
    // column: 0,
    // filename: 'app/index.tsx'

    // Drop the code frame
    error.message = error.message.split('\n\n')[0].trim();
    stack = [
      {
        file: path.join(projectRoot, error.filename), // '/Users/evanbacon/Documents/GitHub/expo/node_modules/@babel/parser/lib/index.js',
        methodName: '[unknown]',
        // arguments: [],
        lineNumber: error.lineNumber,
        column: error.column,
      },
    ];
  } else if (isMetroPackageResolutionError(error)) {
    //   Unable to resolve module stylis from /Users/evanbacon/Documents/GitHub/expo/apps/sandbox/app/index.tsx: stylis could not be found within the project or in these directories:
    // node_modules
    // ../../node_modules

    // ../../node_modules

    // Drop the code frame
    error.message = `Unable to resolve module <b>${error.targetModuleName}</b>.`;
    stack = [
      {
        file: error.originModulePath, // '/Users/evanbacon/Documents/GitHub/expo/apps/sandbox/app/index.tsx',
        methodName: '[unknown]',
        // TODO: Unclear how to get these, Metro should probably be sending down.
        lineNumber: 0,
        column: 0,
      },
    ];
  }

  return new LogBoxLog({
    level: 'static',
    message: {
      content: stripAnsi(error.message),
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

  const errorOverlayEntry = await createSafeMetroEndpointAsync(
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
