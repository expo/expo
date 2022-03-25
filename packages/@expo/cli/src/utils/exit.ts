import * as Log from '../log';
import { guardAsync } from './fn';

type AsyncExitHook = (signal: NodeJS.Signals) => void | Promise<void>;

// We create a queue since Node.js throws an error if we try to append too many listeners:
// (node:4405) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 SIGINT listeners added to [process]. Use emitter.setMaxListeners() to increase limit
const queue: AsyncExitHook[] = [];

/** Add functions that run before the process exits. Returns a function for removing the listeners. */
export function installExitHooks(hook: AsyncExitHook): void {
  queue.push(hook);
}

const preExitHook = (signal: NodeJS.Signals) =>
  guardAsync(async () => {
    Log.debug(`pre-exit (signal: ${signal}, queue length: ${queue.length})`);

    for (const [index, hookAsync] of queue.entries()) {
      try {
        await hookAsync(signal);
      } catch (error: any) {
        Log.debug(`Error in exit hook: %O (queue: ${index})`, error);
      }
    }

    Log.debug(`post-exit (code: ${process.exitCode ?? 0})`);

    process.exit();
  });

const PRE_EXIT_SIGNALS: NodeJS.Signals[] = ['SIGHUP', 'SIGINT', 'SIGTERM', 'SIGBREAK'];

for (const signal of PRE_EXIT_SIGNALS) {
  process.on(signal, preExitHook(signal));
}
