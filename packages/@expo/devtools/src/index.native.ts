import { setGetConnectionInfo } from './DevToolsPluginClientFactory';
import { getConnectionInfo } from './getConnectionInfo.native';

// Initialize the platform-specific getConnectionInfo implementation
setGetConnectionInfo(getConnectionInfo);

export * from './index';
