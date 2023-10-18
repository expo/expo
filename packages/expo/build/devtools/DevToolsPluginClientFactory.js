import { DevToolsPluginClientImplApp } from './DevToolsPluginClientImplApp';
import { DevToolsPluginClientImplBrowser } from './DevToolsPluginClientImplBrowser';
/**
 * Factory of DevToolsPluginClient based on sender types.
 * @hidden
 */
export async function createDevToolsPluginClient(connectionInfo) {
    let client;
    if (connectionInfo.sender === 'app') {
        client = new DevToolsPluginClientImplApp(connectionInfo);
    }
    else {
        client = new DevToolsPluginClientImplBrowser(connectionInfo);
    }
    await client.initAsync();
    return client;
}
//# sourceMappingURL=DevToolsPluginClientFactory.js.map