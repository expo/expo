import { createDevToolsPluginClient } from 'expo/build/devtools/DevToolsPluginClientFactory';
export async function sendMessageToDevToolsPluginClient(method, params) {
    const client = await setupDevToolsPluginClient();
    console.log('CLIENT', client);
    return Promise.resolve('');
}
const setupDevToolsPluginClient = async () => {
    const connectionInfo = {
        pluginName: 'expo-background-task',
        protocolVersion: 1, //PROTOCOL_VERSION,
        sender: 'app',
        devServer: 'http://localhost:8081', // Replace with actual dev server URL
    };
    const client = createDevToolsPluginClient(connectionInfo, {});
    return client;
};
//# sourceMappingURL=message.js.map