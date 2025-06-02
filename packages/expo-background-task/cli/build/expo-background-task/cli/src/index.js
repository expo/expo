// @ts-ignore
import { getDevToolsPluginClientAsync } from '../../../expo/src/devtools';
export default function (cmd) {
    if (cmd === 'list') {
        return new Promise(async (resolve) => {
            const client = await getDevToolsPluginClientAsync('expo-background-task', {});
            console.log('CLIENT:', client);
            const result = await client.sendMessage('getRegisteredBackgroundTasks', { from: 'cli' });
            console.log('Result from getRegisteredBackgroundTasks:', result);
            // Simulate triggering a background task
            resolve('1. Task A\n2. Task B\n3. Task C');
        });
    }
    else if (cmd === 'test') {
        console.log('Triggering background tasks for testing...');
        return new Promise((resolve) => {
            // Simulate triggering a background task
            setTimeout(() => {
                resolve('Background task completed successfully.');
            }, 1000);
        });
    }
    else {
        return Promise.resolve("Unknown command. Use 'list' to see available tasks or 'trigger' to run a task.");
    }
}
export async function sendMessageToDevToolsPluginClient(method, params) {
    //return await getDevToolsPluginClientAsync('expo-background-task');
    // const connectionInfo: ConnectionInfo = {
    //   pluginName: 'expo-background-task',
    //   protocolVersion: 1, //PROTOCOL_VERSION,
    //   sender: 'app',
    //   devServer: 'http://localhost:8081', // Replace with actual dev server URL
    // };
    // const client = createDevToolsPluginClient(connectionInfo, {});
    // console.log('CLIENT', client);
    // return Promise.resolve('');
}
//# sourceMappingURL=index.js.map