import { setGetConnectionInfo } from './DevToolsPluginClientFactory';
import { getConnectionInfo } from './getConnectionInfo';

// Initialize the platform-specific getConnectionInfo implementation
setGetConnectionInfo(getConnectionInfo);

export * from './hooks';
export { setEnableLogging } from './logger';
export { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory';
export { DevToolsPluginClient } from './DevToolsPluginClient';

// Export the EventSubscription type if people need to use explicit type from `addMessageListener`
export type { EventSubscription } from './DevToolsPluginClient';
export type * from './devtools.types';

// Unstable APIs exported for testing purposes.
export { createDevToolsPluginClient as unstable_createDevToolsPluginClient } from './DevToolsPluginClientFactory';
export { WebSocketBackingStore as unstable_WebSocketBackingStore } from './WebSocketBackingStore';
export { getConnectionInfo as unstable_getConnectionInfo } from './getConnectionInfo';

// Export CLI extension APIs
export { runCliExtension } from './runCliExtension';
export { createCliDevToolsPluginClient } from './createCliDevToolsPluginClient';
export { sendDevToolsRequestAsync } from './sendDevToolsRequestAsync';
export type * from './CliExtension.types';
