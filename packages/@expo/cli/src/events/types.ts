import type { collectEventLoggers } from '../events/builder';

/** Collection of all event logger events
 * @privateRemarks
 * When creating a new logger with `events()`, import it here and
 * add it to add its types to this union type.
 */
export type Events = collectEventLoggers<
  [
    // typeof startAsyncEvent,
  ]
>;
