import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    // @ref llp/0004-smart-start-and-project-state.rfc.md §Contract — the port a busy start moved
    // to, so a reader of the event stream can see the dev server is not where it was asked for.
    'dev:start_plan_port_retry': {
      busyPort: number | null;
      offeredPort: number | null;
      port: number | null;
    };
    // @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
    'dev:detach_spawn': { logFile: string; argv: string[] };
    'dev:stop_lock_read': { held: boolean; pid: number | null };
    'dev:stop_signalled': { pid: number; signal: string; ok: boolean };
    'dev:stop_done': { stopped: boolean; pid: number | null; reason: string | null };
  }
}

export const event = events('dev');
export const debugEvent = events.debug('dev');
