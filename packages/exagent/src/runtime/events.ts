import { events } from '2g';

declare module '2g' {
  interface EventRegistry {
    'runtime:cdp_message': { url: string; message: string };
    'runtime:cdp_socket_error': { url: string; error: string };
    'runtime:cdp_target_skipped': { url: string; reason: string };
    /**
     * A target whose runtime could not answer the selection probe, kept as a fallback rather than
     * skipped.
     *
     * @see createDefaultTargetSelector in ./cdpClient
     */
    'runtime:cdp_target_undetermined': { url: string; reason: string };
    'runtime:cdp_parse_failed': { reason: string };
    /**
     * The promise-aware wrapper would not compile, so the expression was run as it was written.
     *
     * @see looksLikeWrapperSyntaxError in ./promiseSettling
     */
    'runtime:cdp_eval_unwrapped': { reason: string };
    /** The app kept a settled value nobody read, because the cleanup after a timeout failed. */
    'runtime:cdp_promise_release_failed': { reason: string };
  }
}

export const event = events('runtime');
export const debugEvent = events.debug('runtime');
