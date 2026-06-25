import type { collectEventLoggers } from '../events/builder';
import type { event as devToolsPluginManagerEvent } from '../start/server/DevToolsPluginManager';
import type { event as metroBundlerDevServerEvent } from '../start/server/metro/MetroBundlerDevServer';
import type { event as metroTerminalReporterEvent } from '../start/server/metro/MetroTerminalReporter';
import type { event as instantiateMetroEvent } from '../start/server/metro/instantiateMetro';
import type { event as nodeEnvEvent } from '../utils/nodeEnv';
import type { rootEvent } from './index';

/** Collection of all event logger events
 * @privateRemarks
 * When creating a new logger with `events()`, import it here and
 * add it to add its types to this union type.
 */
export type Events = collectEventLoggers<
  [
    typeof rootEvent,
    typeof devToolsPluginManagerEvent,
    typeof metroBundlerDevServerEvent,
    typeof metroTerminalReporterEvent,
    typeof instantiateMetroEvent,
    typeof nodeEnvEvent,
  ]
>;
