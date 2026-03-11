import { createDevToolsPluginClient } from './DevToolsPluginClientFactory.js';
import { PROTOCOL_VERSION } from './ProtocolVersion.js';
/**
 * Creates a `DevToolsPluginClient` for use in CLI extension processes.
 *
 * Unlike `getDevToolsPluginClientAsync`, this bypasses the instance cache —
 * correct for one-shot CLI processes that should each get their own connection.
 */
export async function createCliDevToolsPluginClient(pluginName, app, options) {
    const url = new URL(app.webSocketDebuggerUrl);
    return createDevToolsPluginClient({
        sender: 'browser',
        devServer: url.host,
        pluginName,
        protocolVersion: PROTOCOL_VERSION,
        useWss: url.protocol === 'wss:',
    }, options);
}
//# sourceMappingURL=createCliDevToolsPluginClient.js.map