/**
 * Copyright © 2023 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree. *
 */
import chalk from 'chalk';
import type { Terminal } from 'metro-core';
import util from 'util';

import { getMetroStackAsLogString, getSymbolicatedMetroStackAsync } from './metroErrorInterface';

const groupStack: ClientLogLevel[] = [];
let collapsedGuardTimer: ReturnType<typeof setTimeout>;

type ClientLogLevel =
  | 'error'
  | 'trace'
  | 'info'
  | 'warn'
  | 'log'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'debug';

type ClientLogMode = 'BRIDGE' | 'NOBRIDGE';

function colorFunctionForLevel(level: ClientLogLevel) {
  return level === 'error'
    ? chalk.inverse.red
    : level === 'warn'
    ? chalk.inverse.yellow
    : chalk.inverse.white;
}

async function logToConsoleAsync(
  projectRoot: string,
  terminal: Terminal,
  level: ClientLogLevel,
  mode: ClientLogMode,
  ...data: any[]
) {
  const logFunction = console[level] && level !== 'trace' ? level : 'log';
  const color = colorFunctionForLevel(level);

  if (level === 'group') {
    groupStack.push(level);
  } else if (level === 'groupCollapsed') {
    groupStack.push(level);
    clearTimeout(collapsedGuardTimer);
    // Inform users that logs get swallowed if they forget to call `groupEnd`.
    collapsedGuardTimer = setTimeout(() => {
      if (groupStack.includes('groupCollapsed')) {
        terminal.log(
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

  if (groupStack.includes('groupCollapsed')) {
    return;
  }

  // Remove excess whitespace at the end of a log message, if possible.
  const lastItem = data[data.length - 1];

  if (typeof lastItem === 'string') {
    data[data.length - 1] = lastItem.trimEnd();
  }

  const modePrefix = !mode || mode === 'BRIDGE' ? '' : `(${mode.toUpperCase()}) `;

  // TODO: Can we add the platform tag back? Maybe there's a hint in the websocket connection? Otherwise we could pull from the stack trace sometimes
  // finally, we could try to PR support into HMRClient in React Native.

  const tMode =
    color.bold(` ${modePrefix}${logFunction.toUpperCase()} `) +
    ''.padEnd(groupStack.length * 2, ' ');

  // NOTE:
  // - If there's a stack trace, then symbolicate and dim based on the Expo Metro config `INTERNAL_CALLSITES_REGEX`
  //   console.log('data', data);

  if (['error', 'warn'].includes(level) && data.length > 1) {
    // console.log(data[1]);
    const results = await getSymbolicatedMetroStackAsync(projectRoot, {
      message: data[0],
      stack: data[1].match(/^\s+at\s((?:\n|.*)+)/im)?.[0],
    });

    if (results) {
      terminal.log(
        tMode + ' ' + data[0] + '\n',
        '\n' + getMetroStackAsLogString(projectRoot, results)
      );
      return;
    }
  }

  terminal.log(
    tMode,
    // `util.format` actually accepts any arguments.
    // If the first argument is a string, it tries to format it.
    // Otherwise, it just concatenates all arguments.
    // $FlowIssue[incompatible-call] util.format expected the first argument to be a string
    util.format(...data)
  );
}

export default logToConsoleAsync;
