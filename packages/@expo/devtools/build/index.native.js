import { setGetConnectionInfo } from './DevToolsPluginClientFactory.js';
import { getConnectionInfo } from './getConnectionInfo.native.js';
// Initialize the platform-specific getConnectionInfo implementation
setGetConnectionInfo(getConnectionInfo);
export * from './index.js';
export { startCliListenerAsync } from './startCliListenerAsync.native.js';
//# sourceMappingURL=index.native.js.map