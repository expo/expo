import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    // @ref llp/0004-smart-start-and-project-state.rfc.md §Plan contract — the port a busy start moved
    // to, so a reader of the event stream can see the dev server is not where it was asked for.
    'dev:start_plan_port_retry': {
      busyPort: number | null;
      offeredPort: number | null;
      port: number | null;
    };
    // @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
    'dev:detach_spawn': { logFile: string; argv: string[] };
    // `ownsTarget` is false for a lock this project holds on a port other than the one `--port`
    // named: the lock was read and deliberately not acted on (llp/0021 §The rules).
    'dev:stop_lock_read': { held: boolean; pid: number | null; ownsTarget: boolean };
    'dev:stop_signalled': { pid: number; signal: string; ok: boolean };
    // The three checks, separately, because the conclusion is drawn from the first two and the
    // third is the one that used to be able to overrule them (llp/0005 §Stopping the app
    // listener). A reader of the stream can see which of them the verdict came from.
    'dev:stop_outcome': { processGone: boolean; lockGone: boolean; portFree: boolean };
    'dev:stop_done': { stopped: boolean; pid: number | null; reason: string | null };
  }
}

export const event = events('dev');
export const debugEvent = events.debug('dev');
