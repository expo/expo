"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDevToolsPluginClient = createDevToolsPluginClient;
exports.getDevToolsPluginClientAsync = getDevToolsPluginClientAsync;
exports.cleanupDevToolsPluginInstances = cleanupDevToolsPluginInstances;
const DevToolsPluginClientImplApp_1 = require("./DevToolsPluginClientImplApp");
const DevToolsPluginClientImplBrowser_1 = require("./DevToolsPluginClientImplBrowser");
const getConnectionInfo_1 = require("./getConnectionInfo");
const instanceMap = {};
/**
 * Factory of DevToolsPluginClient based on sender types.
 * @hidden
 */
async function createDevToolsPluginClient(connectionInfo, options) {
    let client;
    if (connectionInfo.sender === 'app') {
        client = new DevToolsPluginClientImplApp_1.DevToolsPluginClientImplApp(connectionInfo, options);
    }
    else {
        client = new DevToolsPluginClientImplBrowser_1.DevToolsPluginClientImplBrowser(connectionInfo, options);
    }
    await client.initAsync();
    return client;
}
/**
 * Public API to get the DevToolsPluginClient instance.
 */
async function getDevToolsPluginClientAsync(pluginName, options) {
    const connectionInfo = (0, getConnectionInfo_1.getConnectionInfo)();
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
function cleanupDevToolsPluginInstances() {
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