/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { INTERNAL_CALLSITES_REGEX } from '@expo/metro-config';
import chalk from 'chalk';
import path from 'path';
// @ts-expect-error
import { mapSourcePosition } from 'source-map-support';
import * as stackTraceParser from 'stacktrace-parser';

import { parseErrorStack } from './metro/log-box/LogBoxSymbolication';
import { env } from '../../utils/env';
import { memoize } from '../../utils/fn';

const groupStack: any = [];
let collapsedGuardTimer: ReturnType<typeof setTimeout> | undefined;

export function logLikeMetro(
  originalLogFunction: (...args: any[]) => void,
  level: string,
  platform: string,
  ...data: any[]
) {
  // @ts-expect-error
  const logFunction = console[level] && level !== 'trace' ? level : 'log';
  const color =
    level === 'error'
      ? chalk.inverse.red
      : level === 'warn'
        ? chalk.inverse.yellow
        : chalk.inverse.white;

  if (level === 'group') {
    groupStack.push(level);
  } else if (level === 'groupCollapsed') {
    groupStack.push(level);
    clearTimeout(collapsedGuardTimer);
    // Inform users that logs get swallowed if they forget to call `groupEnd`.
    collapsedGuardTimer = setTimeout(() => {
      if (groupStack.includes('groupCollapsed')) {
        originalLogFunction(
          chalk.inverse.yellow.bold(' WARN '),
          'Expected `console.groupEnd` to be called after `console.groupCollapsed`.'
        );
        groupStack.length = 0;
      }
    }, 3000);
    return;
  } else if (level === 'groupEnd') {
    groupStack.pop();
    if (!groupStack.length) {
      clearTimeout(collapsedGuardTimer);
    }
    return;
  }

  if (!groupStack.includes('groupCollapsed')) {
    // Remove excess whitespace at the end of a log message, if possible.
    const lastItem = data[data.length - 1];
    if (typeof lastItem === 'string') {
      data[data.length - 1] = lastItem.trimEnd();
    }

    const modePrefix = chalk.bold`${platform}`;
    originalLogFunction(
      modePrefix +
        ' ' +
        color.bold(` ${logFunction.toUpperCase()} `) +
        ''.padEnd(groupStack.length * 2, ' '),
      ...data
    );
  }
}

const escapedPathSep = path.sep === '\\' ? '\\\\' : path.sep;
const SERVER_STACK_MATCHER = new RegExp(
  `${escapedPathSep}(react-dom|metro-runtime|expo-router)${escapedPathSep}`
);

function augmentLogsInternal(projectRoot: string) {
  const augmentLog = (name: string, fn: typeof console.log) => {
    // @ts-expect-error: TypeScript doesn't know about polyfilled functions.
    if (fn.__polyfilled) {
      return fn;
    }
    const originalFn = fn.bind(console);
    function logWithStack(...args: any[]) {
      const stack = new Error().stack;
      // Check if the log originates from the server.
      const isServerLog = !!stack?.match(SERVER_STACK_MATCHER);

      if (isServerLog) {
        if (name === 'error' || name === 'warn') {
          if (
            args.length === 2 &&
            typeof args[1] === 'string' &&
            args[1].trim().startsWith('at ')
          ) {
            // react-dom custom stacks which are always broken.
            // A stack string like:
            //    at div
            //    at http://localhost:8081/node_modules/expo-router/node/render.bundle?platform=web&dev=true&hot=false&transform.engine=hermes&transform.routerRoot=app&resolver.environment=node&transform.environment=node:38008:27
            //    at Background (http://localhost:8081/node_modules/expo-router/node/render.bundle?platform=web&dev=true&hot=false&transform.engine=hermes&transform.routerRoot=app&resolver.environment=node&transform.environment=node:151009:7)
            const customStack = args[1];

            try {
              const parsedStack = parseErrorStack(customStack);
              const symbolicatedStack = parsedStack.map((line: any) => {
                const mapped = mapSourcePosition({
                  source: line.file,
                  line: line.lineNumber,
                  column: line.column,
                }) as {
                  // '/Users/evanbacon/Documents/GitHub/lab/sdk51-beta/node_modules/react-native-web/dist/exports/View/index.js',
                  source: string;
                  line: number;
                  column: number;
                  // 'hrefAttrs'
                  name: string | null;
                };

                const fallbackName = mapped.name ?? '<unknown>';
                return {
                  file: mapped.source,
                  lineNumber: mapped.line,
                  column: mapped.column,
                  // Attempt to preserve the react component name if possible.
                  methodName: line.methodName
                    ? line.methodName === '<unknown>'
                      ? fallbackName
                      : line.methodName
                    : fallbackName,
                  arguments: line.arguments ?? [],
                };
              });

              // Replace args[1] with the formatted stack.
              args[1] = '\n' + formatParsedStackLikeMetro(projectRoot, symbolicatedStack, true);
            } catch {
              // If symbolication fails, log the original stack.
              args.push('\n' + formatStackLikeMetro(projectRoot, customStack));
            }
          } else {
            args.push('\n' + formatStackLikeMetro(projectRoot, stack!));
          }
        }

        logLikeMetro(originalFn, name, 'λ', ...args);
      } else {
        originalFn(...args);
      }
    }
    logWithStack.__polyfilled = true;
    return logWithStack;
  };

  ['trace', 'info', 'error', 'warn', 'log', 'group', 'groupCollapsed', 'groupEnd', 'debug'].forEach(
    (name) => {
      // @ts-expect-error
      console[name] = augmentLog(name, console[name]);
    }
  );
}

export function formatStackLikeMetro(projectRoot: string, stack: string) {
  // Remove `Error: ` from the beginning of the stack trace.
  // Dim traces that match `INTERNAL_CALLSITES_REGEX`

  const stackTrace = stackTraceParser.parse(stack);
  return formatParsedStackLikeMetro(projectRoot, stackTrace);
}

function formatParsedStackLikeMetro(
  projectRoot: string,
  stackTrace: stackTraceParser.StackFrame[],
  isComponentStack = false
) {
  // Remove `Error: ` from the beginning of the stack trace.
  // Dim traces that match `INTERNAL_CALLSITES_REGEX`

  return stackTrace
    .filter(
      (line) =>
        line.file &&
        // Ignore unsymbolicated stack frames. It's not clear how this is possible but it sometimes happens when the graph changes.
        !/^https?:\/\//.test(line.file) &&
        (isComponentStack ? true : line.file !== '<anonymous>')
    )
    .map((line) => {
      // Use the same regex we use in Metro config to filter out traces:
      const isCollapsed = INTERNAL_CALLSITES_REGEX.test(line.file!);
      if (!isComponentStack && isCollapsed && !env.EXPO_DEBUG) {
        return null;
      }
      // If a file is collapsed, print it with dim styling.
      const style = isCollapsed ? chalk.dim : chalk.gray;
      // Use the `at` prefix to match Node.js
      let fileName = line.file!;
      if (fileName.startsWith(path.sep)) {
        fileName = path.relative(projectRoot, fileName);
      }
      if (line.lineNumber != null) {
        fileName += `:${line.lineNumber}`;
        if (line.column != null) {
          fileName += `:${line.column}`;
        }
      }

      return style(`  ${line.methodName} (${fileName})`);
    })
    .filter(Boolean)
    .join('\n');
}

/** Augment console logs to check the stack trace and format like Metro logs if we think the log came from the SSR renderer or an API route. */
export const augmentLogs = memoize(augmentLogsInternal);
