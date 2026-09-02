import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    /**
     * The dev server of this project is published at `address`: connecting to it answers with
     * `url`. Emitted once the dev server has reported the port it actually listens on.
     *
     * @see llp/0004-smart-start-and-project-state.rfc.md §Status
     */
    'cli:dev_lock_acquired': {
      address: string;
      url: string;
      port: number;
      /** How the port was resolved: the dev server's log, the `--port` argument, or the default. */
      portSource: 'log' | 'arg' | 'default';
      pid: number;
    };
    /**
     * No lock was taken, and the dev server ran anyway. The lock is a convenience, so this is
     * never an error: `in-use` means another `@expo/agent-cli` already publishes this project's dev
     * server, and the other reasons mean the address could not be taken at all.
     */
    'cli:dev_lock_skipped': {
      address: string;
      reason: 'in-use' | 'dev-server-exited' | 'error';
      /** Where the process that already holds the address says its dev server listens. */
      holderUrl?: string | null;
      /** PID of the process that already holds the address, when it named one. */
      holderPid?: number | null;
      error?: SerializedError;
    };
    /**
     * A socket file left behind by a dev server that is gone was removed to take the address.
     * Nothing was ever read out of it — the file answers no connection, which is how it was
     * known to be dead.
     */
    'cli:dev_lock_zombie_replaced': { address: string };
    /** The lock was released, so the address answers nothing again. */
    'cli:dev_lock_released': { address: string };
    /** A connection to the lock was accepted, but what it answered was not a lock line. */
    'cli:dev_lock_unreadable': { address: string };
    /** The lock server reported an error while it was listening. */
    'cli:dev_lock_server_error': { address: string; error: SerializedError };
  }
}

export const event = events('cli');
export const debugEvent = events.debug('cli');
