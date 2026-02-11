import { ChildProcess } from 'node:child_process';
import process from 'node:process';

import { guardAsync } from './fn';
import { warn } from '../log';

const debug = require('debug')('expo:utils:exit') as typeof console.log;

// NOTE: This is an internal method, not designed to be exposed. It's also our only way to get this info
declare global {
  namespace NodeJS {
    interface Process {
      _getActiveHandles(): readonly any[];
    }
  }
}

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
  // Create a list of the expected active resources before exiting.
  // Note, the order is undeterministic
  const expectedResources = [
    process.stdout.isTTY ? 'TTYWrap' : 'PipeWrap',
    process.stderr.isTTY ? 'TTYWrap' : 'PipeWrap',
    process.stdin.isTTY ? 'TTYWrap' : 'PipeWrap',
  ];
  // Check active resources, besides the TTYWrap/PipeWrap (process.stdin, process.stdout, process.stderr)
  const activeResources = process.getActiveResourcesInfo() as string[];
  // Filter the active resource list by subtracting the expected resources, in undeterministic order
  const unexpectedActiveResources = activeResources.filter((activeResource) => {
    const index = expectedResources.indexOf(activeResource);
    if (index >= 0) {
      expectedResources.splice(index, 1);
      return false;
    }

    return true;
  });

  // Check if only Timeouts remain (no blocking resources like ProcessWrap/PipeWrap)
  const hasBlockingResources = unexpectedActiveResources.some(
    (resource) => resource !== 'Timeout' && resource !== 'CloseReq'
  );

  const canExitProcess = !unexpectedActiveResources.length || !hasBlockingResources;
  if (canExitProcess) {
    if (unexpectedActiveResources.length && !hasBlockingResources) {
      debug('only non-blocking resources remain (Timeout/CloseReq), process can safely exit');
    } else {
      debug('no active resources detected, process can safely exit');
    }
    return;
  } else {
    debug(
      `process is trying to exit, but is stuck on unexpected active resources:`,
      unexpectedActiveResources
    );
  }

  // Check if the process needs to be force-closed
  const elapsedTime = Date.now() - startedAtMs;
  if (elapsedTime > waitUntilExitMs) {
    debug('active handles detected past the exit delay, forcefully exiting:', activeResources);
    tryWarnActiveProcesses();
    return process.exit(0);
  }

  const timeoutId = setTimeout(() => {
    // Ensure the timeout is cleared before checking the active resources
    clearTimeout(timeoutId);
    // Check if the process can exit
    ensureProcessExitsAfterDelay(waitUntilExitMs, startedAtMs);

    // setTimeout is using the global definitions from React Native which is missing the unref method in Node.js.
  }, 100) as unknown as NodeJS.Timeout;

  // Unref the timeout so it doesn't prevent the process from exiting naturally
  // when this timeout is the only remaining active resource
  timeoutId.unref();
}

/**
 * Try to warn the user about unexpected active processes running in the background.
 * This uses the internal `process._getActiveHandles` method, within a try-catch block.
 * If active child processes are detected, the commands of these processes are logged.
 *
 * @example ```bash
 * Done writing bundle output
 * Detected 2 processes preventing Expo from exiting, forcefully exiting now.
 *   - node /Users/cedric/../node_modules/nativewind/dist/metro/tailwind/v3/child.js
 *   - node /Users/cedric/../node_modules/nativewind/dist/metro/tailwind/v3/child.js
 * ```
 */
function tryWarnActiveProcesses() {
  const activeProcesses: string[] = [];
  const handleSummary: Record<string, number> = {};
  const timeoutDetails: string[] = [];

  try {
    const handles = process._getActiveHandles();

    // Categorize handles by their constructor name
    for (const handle of handles) {
      const name = handle?.constructor?.name ?? 'Unknown';
      handleSummary[name] = (handleSummary[name] ?? 0) + 1;

      // Collect ChildProcess command info
      if (handle instanceof ChildProcess) {
        activeProcesses.push(handle.spawnargs.join(' '));
      }

      // Try to get more info about Timeout handles
      if (name === 'Timeout') {
        try {
          // Attempt to get callback name or source info
          const callback = handle._onTimeout ?? handle._repeat;
          const callbackName = callback?.name || '<anonymous>';
          const delay = handle._idleTimeout ?? 'unknown';
          timeoutDetails.push(`Timeout(${delay}ms, fn: ${callbackName})`);
        } catch {
          timeoutDetails.push('Timeout(details unavailable)');
        }
      }
    }

    // Log detailed handle info when debug is enabled
    debug('active handles by type:', handleSummary);
    if (timeoutDetails.length) {
      debug('timeout details:', timeoutDetails);
    }
  } catch (error) {
    debug('failed to get active process information:', error);
  }

  if (!activeProcesses.length) {
    warn('Something prevented Expo from exiting, forcefully exiting now.');
    // Log handle summary when no specific processes are identified
    if (Object.keys(handleSummary).length > 0) {
      debug('handle summary (use DEBUG=expo:utils:exit for details):', handleSummary);
    }
  } else {
    const singularOrPlural =
      activeProcesses.length === 1 ? '1 process' : `${activeProcesses.length} processes`;

    warn(`Detected ${singularOrPlural} preventing Expo from exiting, forcefully exiting now.`);
    warn('  - ' + activeProcesses.join('\n  - '));
  }
}
