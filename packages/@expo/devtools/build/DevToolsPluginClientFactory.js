import { DevToolsPluginClientImplApp } from './DevToolsPluginClientImplApp.js';
import { DevToolsPluginClientImplBrowser } from './DevToolsPluginClientImplBrowser.js';
let _getConnectionInfo = null;
/**
 * Set the platform-specific getConnectionInfo implementation.
 * This must be called before using getDevToolsPluginClientAsync.
 * @hidden
 */
export function setGetConnectionInfo(fn) {
    _getConnectionInfo = fn;
}
const instanceMap = {};
/**
 * Factory of DevToolsPluginClient based on sender types.
 * @hidden
 */
export async function createDevToolsPluginClient(connectionInfo, options) {
    let client;
    if (connectionInfo.sender === 'app') {
        client = new DevToolsPluginClientImplApp(connectionInfo, options);
    }
    else {
        client = new DevToolsPluginClientImplBrowser(connectionInfo, options);
    }
    await client.initAsync();
    return client;
}
/**
 * Public API to get the DevToolsPluginClient instance.
 */
export async function getDevToolsPluginClientAsync(pluginName, options) {
    if (_getConnectionInfo == null) {
        throw new Error('getConnectionInfo has not been initialized. Ensure the correct platform entry point is loaded.');
    }
    const connectionInfo = _getConnectionInfo();
    let instance = instanceMap[pluginName];
    if (instance != null) {
        if (instance instanceof Promise) {
            return instance;
        }
        if (instance.isConnected() === false ||
            instance.connectionInfo.devServer !== connectionInfo.devServer) {
            await instance.closeAsync();
            delete instanceMap[pluginName];
            instance = null;
        }
    }
    if (instance == null) {
        const instancePromise = createDevToolsPluginClient({ ...connectionInfo, pluginName }, options);
        instanceMap[pluginName] = instancePromise;
        instance = await instancePromise;
        instanceMap[pluginName] = instance;
    }
    return instance;
}
/**
 * Internal testing API to cleanup all DevToolsPluginClient instances.
 */
export function cleanupDevToolsPluginInstances() {
    for (const pluginName of Object.keys(instanceMap)) {
        const instance = instanceMap[pluginName];
        delete instanceMap[pluginName];
        if (instance instanceof Promise) {
            instance.then((instance) => instance.closeAsync());
        }
        else {
            instance.closeAsync();
        }
    }
}
//# sourceMappingURL=DevToolsPluginClientFactory.js.map