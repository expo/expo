/**
 * Copyright (c) 2021 Expo, Inc.
 * Copyright (c) 2018 Drifty Co.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as cp from 'child_process';
import Debug from 'debug';
import * as util from 'util';

const debug = Debug('expo:utils:process');

export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let r: any;

  const wrapper: any = (...args: any[]): any => {
    if (!called) {
      called = true;
      r = fn(...args);
    }

    return r;
  };

  return wrapper;
}
export const exec = util.promisify(cp.exec);
export const execFile = util.promisify(cp.execFile);
export const wait = util.promisify(setTimeout);

export type ExitQueueFn = () => Promise<void>;

const exitQueue: ExitQueueFn[] = [];

export function onBeforeExit(fn: ExitQueueFn): void {
  exitQueue.push(fn);
}

const BEFORE_EXIT_SIGNALS: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'];

const beforeExitHandlerWrapper = (signal: NodeJS.Signals) =>
  once(async () => {
    debug('onBeforeExit handler: %s received', signal);
    debug('onBeforeExit handler: running %s queued functions', exitQueue.length);

    for (const [i, fn] of exitQueue.entries()) {
      try {
        await fn();
      } catch (e) {
        debug('Error from function %d in exit queue: %O', i, e);
      }
    }

    debug('onBeforeExit handler: exiting (exit code %s)', process.exitCode ? process.exitCode : 0);

    process.exit();
  });

for (const signal of BEFORE_EXIT_SIGNALS) {
  process.on(signal, beforeExitHandlerWrapper(signal));
}
