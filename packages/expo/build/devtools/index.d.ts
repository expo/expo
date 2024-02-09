import { DevToolsPluginClient } from './DevToolsPluginClient';
import { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory';
export { getDevToolsPluginClientAsync };
export type { EventSubscription } from 'fbemitter';
export { setEnableLogging } from './logger';
/**
 * A React hook to get the DevToolsPluginClient instance.
 */
export declare function useDevToolsPluginClient(pluginName: string): DevToolsPluginClient | null;
//# sourceMappingURL=index.d.ts.map