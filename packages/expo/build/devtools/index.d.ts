import { DevToolsPluginClient } from './DevToolsPluginClient';
import { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory';
import type { DevToolsPluginClientOptions } from './devtools.types';
export { getDevToolsPluginClientAsync, DevToolsPluginClient };
export type { DevToolsPluginClientOptions };
export type { EventSubscription } from './DevToolsPluginClient';
export { setEnableLogging } from './logger';
export { startDevToolsPluginListenerAsync } from './CliExtensionMessages';
export { sendMessageAsync } from './CliExtensionSendMessageAsync';
export { cliExtension } from './CliExtension';
/**
 * A React hook to get the DevToolsPluginClient instance.
 */
export declare function useDevToolsPluginClient(pluginName: string, options?: DevToolsPluginClientOptions): DevToolsPluginClient | null;
//# sourceMappingURL=index.d.ts.map