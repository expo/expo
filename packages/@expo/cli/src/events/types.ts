import type { rootEvent } from './index';
import type { collectEventLoggers } from '../events/builder';
import type { event as metroTerminalReporterEvent } from '../start/server/metro/MetroTerminalReporter';

/** Collection of all event logger events
 * @privateRemarks
 * When creating a new logger with `events()`, import it here and
 * add it to add its types to this union type.
 */
export type Events = collectEventLoggers<[typeof rootEvent, typeof metroTerminalReporterEvent]>;
