import { setGetConnectionInfo } from './DevToolsPluginClientFactory.js';
import { getConnectionInfo } from './getConnectionInfo.native.js';
// Initialize the platform-specific getConnectionInfo implementation
setGetConnectionInfo(getConnectionInfo);
export * from './hooks.js';
export { setEnableLogging } from './logger.js';
export { getDevToolsPluginClientAsync } from './DevToolsPluginClientFactory.js';
export { DevToolsPluginClient } from './DevToolsPluginClient.js';
// Unstable APIs exported for testing purposes.
export { createDevToolsPluginClient as unstable_createDevToolsPluginClient } from './DevToolsPluginClientFactory.js';
export { WebSocketBackingStore as unstable_WebSocketBackingStore } from './WebSocketBackingStore.js';
export { getConnectionInfo as unstable_getConnectionInfo } from './getConnectionInfo.native.js';
//# sourceMappingURL=index.native.js.map