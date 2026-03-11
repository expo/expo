import type { ExpoCliExtensionAppInfo } from './CliExtension.types.js';
import type { DevToolsPluginClient } from './DevToolsPluginClient.js';
import type { DevToolsPluginClientOptions } from './devtools.types.js';
/**
 * Creates a `DevToolsPluginClient` for use in CLI extension processes.
 *
 * Unlike `getDevToolsPluginClientAsync`, this bypasses the instance cache —
 * correct for one-shot CLI processes that should each get their own connection.
 */
export declare function createCliDevToolsPluginClient(pluginName: string, app: ExpoCliExtensionAppInfo, options?: DevToolsPluginClientOptions): Promise<DevToolsPluginClient>;
//# sourceMappingURL=createCliDevToolsPluginClient.d.ts.map