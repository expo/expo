import type { DevToolsPluginClient } from './DevToolsPluginClient.js';
import type { ConnectionInfo, DevToolsPluginClientOptions } from './devtools.types.js';
type GetConnectionInfoFn = () => Omit<ConnectionInfo, 'pluginName'>;
/**
 * Set the platform-specific getConnectionInfo implementation.
 * This must be called before using getDevToolsPluginClientAsync.
 * @hidden
 */
export declare function setGetConnectionInfo(fn: GetConnectionInfoFn): void;
/**
 * Factory of DevToolsPluginClient based on sender types.
 * @hidden
 */
export declare function createDevToolsPluginClient(connectionInfo: ConnectionInfo, options?: DevToolsPluginClientOptions): Promise<DevToolsPluginClient>;
/**
 * Public API to get the DevToolsPluginClient instance.
 */
export declare function getDevToolsPluginClientAsync(pluginName: string, options?: DevToolsPluginClientOptions): Promise<DevToolsPluginClient>;
/**
 * Internal testing API to cleanup all DevToolsPluginClient instances.
 */
export declare function cleanupDevToolsPluginInstances(): void;
export {};
//# sourceMappingURL=DevToolsPluginClientFactory.d.ts.map