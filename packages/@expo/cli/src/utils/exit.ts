import process from 'node:process';

import { guardAsync } from './fn';

const debug = require('debug')('expo:utils:exit') as typeof console.log;

type AsyncExitHook = (signal: NodeJS.Signals) => void | Promise<void>;

const PRE_EXIT_SIGNALS: NodeJS.Signals[] = ['SIGHUP', 'SIGINT', 'SIGTERM', 'SIGBREAK'];

// We create a queue since Node.js throws an error if we try to append too many listeners:
// (node:4405) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added to [process]. Use emitter.setMaxListeners() to increase limit
const queue: AsyncExitHook[] = [];

let unsubscribe: (() => void) | null = null;

/** Add functions that run before the process exits. Returns a function for removing the listeners. */
export function installExitHooks(asyncExitHook: AsyncExitHook): () => void {
  // We need to instantiate the master listener the first time the queue is used.
  if (!queue.length) {
    // Track the master listener so we can remove it later.
    unsubscribe = attachMasterListener();
  }

  queue.push(asyncExitHook);

  return () => {
    const index = queue.indexOf(asyncExitHook);
    if (index >= 0) {
      queue.splice(index, 1);
    }
    // Clean up the master listener if we don't need it anymore.
    if (!queue.length) {
      unsubscribe?.();
    }
  };
}

// Create a function that runs before the process exits and guards against running multiple times.
function createExitHook(signal: NodeJS.Signals) {
  return guardAsync(async () => {
    debug(`pre-exit (signal: ${signal}, queue length: ${queue.length})`);

    for (const [index, hookAsync] of Object.entries(queue)) {
      try {
        await hookAsync(signal);
      } catch (error: any) {
        debug(`Error in exit hook: %O (queue: ${index})`, error);
      }
    }

    debug(`post-exit (code: ${process.exitCode ?? 0})`);

    process.exit();
  });
}

function attachMasterListener() {
  const hooks: [NodeJS.Signals, () => any][] = [];
  for (const signal of PRE_EXIT_SIGNALS) {
    const hook = createExitHook(signal);
    hooks.push([signal, hook]);
    process.on(signal, hook);
  }
  return () => {
    for (const [signal, hook] of hooks) {
      process.removeListener(signal, hook);
    }
  };
}

/**
 * Monitor if the current process is exiting before the delay is reached.
 * If there are active resources, the process will be forced to exit after the delay is reached.
 *
 * @see https://nodejs.org/docs/latest-v18.x/api/process.html#processgetactiveresourcesinfo
 */
export function ensureProcessExitsAfterDelay(waitUntilExitMs = 10000, startedAtMs = Date.now()) {
  // Check active resources, besides the TTYWrap (process.stdin, process.stdout, process.stderr)
  // @ts-expect-error Added in v17.3.0, v16.14.0 but unavailable in v18 typings
  const activeResources = process.getActiveResourcesInfo() as string[];
  const canExitProcess = activeResources.filter((resource) => resource !== 'TTYWrap').length === 0;
  if (canExitProcess) {
    return debug('no active resources detected, process can safely exit');
  }

  // Check if the process needs to be force-closed
  const elapsedTime = Date.now() - startedAtMs;
  if (elapsedTime > waitUntilExitMs) {
    debug('active handles detected past the exit delay, forcefully exiting:', activeResources);
    return process.exit(0);
  }

  const timeoutId = setTimeout(() => {
    // Ensure the timeout is cleared before checking the active resources
    clearTimeout(timeoutId);
    // Check if the process can exit
    ensureProcessExitsAfterDelay(waitUntilExitMs, startedAtMs);
  }, 100);
}
