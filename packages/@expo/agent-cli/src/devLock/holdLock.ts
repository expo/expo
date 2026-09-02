// @ref llp/0004-smart-start-and-project-state.rfc.md §Status
// The dev-server wrapper's half of the lock: resolve the port, publish it, hold it, report it.

import * as Log from '../log';
import { PROGRAM_NAME } from '../programName';
import { lockAddressFor } from './address';
import { debugEvent, event } from './events';
import { resolveDevServerPortAsync, type ResolveDevServerPortOptions } from './port';
import { acquireDevServerLockAsync } from './server';
import type { DevServerLockHandle } from './types';

export type HoldDevServerLockOptions = ResolveDevServerPortOptions;

/**
 * Publish where this project's dev server listens, and hold the address until it is released.
 *
 * Best effort by contract: the dev server is the product and the lock is a convenience, so every
 * failure resolves to `null` and the caller has nothing to handle. A caller still has to call
 * `release()` on what it gets, which the wrapper does in its `finally`.
 *
 * @returns the held lock, or null when none was taken.
 */
export async function holdDevServerLockAsync(
  projectRoot: string,
  args: string[],
  options: HoldDevServerLockOptions
): Promise<DevServerLockHandle | null> {
  // Derived once, inside the try, so the catch below has an address to report without being able
  // to fail deriving one — a `catch` that can throw is not a safety net.
  let address = '';
  try {
    address = lockAddressFor(projectRoot).address;
    const { port, source } = await resolveDevServerPortAsync(projectRoot, args, options);

    if (options.isRunning?.() === false) {
      // The dev server exited before it said where it listens, so there is nothing to point at.
      debugEvent('dev_lock_skipped', { address, reason: 'dev-server-exited' });
      return null;
    }

    const result = await acquireDevServerLockAsync({
      url: `http://127.0.0.1:${port}`,
      port,
      pid: process.pid,
      startedAt: new Date(options.since).toISOString(),
      projectRoot,
    });

    switch (result.status) {
      case 'acquired': {
        if (result.lock.replacedStale) {
          event('dev_lock_zombie_replaced', { address: result.lock.address });
        }
        event('dev_lock_acquired', {
          address: result.lock.address,
          url: `http://127.0.0.1:${port}`,
          port,
          portSource: source,
          pid: process.pid,
        });
        return result.lock;
      }

      case 'in-use':
        // Two dev servers for one project is a thing people do on purpose, and `expo start` says
        // which port it took, so this is reported on the event stream and nowhere else: a warning
        // here would land in the middle of the bundler's output for a situation that is fine.
        event('dev_lock_skipped', {
          address: result.address,
          reason: 'in-use',
          holderUrl: result.holder?.url ?? null,
          holderPid: result.holder?.pid ?? null,
        });
        return null;

      case 'failed':
        event('dev_lock_skipped', {
          address: result.address,
          reason: 'error',
          error: debugEvent.error(result.error),
        });
        Log.warn(
          `Could not publish the dev server port for this project (${result.error.message}). The dev server is unaffected; other ${PROGRAM_NAME} commands may have to scan for its port. Pass --dev-server-url to name it instead.`
        );
        return null;
    }
  } catch (error: unknown) {
    // The lock must never be the reason a dev server run reports a problem.
    debugEvent('dev_lock_skipped', {
      address,
      reason: 'error',
      error: debugEvent.error(error as Error),
    });
    return null;
  }
}
