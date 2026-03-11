import { runCliExtension, createCliDevToolsPluginClient, sendDevToolsRequestAsync, } from '@expo/devtools';
const PLUGIN_NAME = 'expo-background-task';
const blue = (s) => `\x1b[34m${s}\x1b[0m`;
runCliExtension(async ({ command, app }, console) => {
    const client = await createCliDevToolsPluginClient(PLUGIN_NAME, app);
    try {
        if (command === 'list') {
            const response = await sendDevToolsRequestAsync(client, 'getRegisteredBackgroundTasks');
            if (response.method === 'error') {
                throw new Error(response.error);
            }
            console.info(`${blue(app.title)}: ${response.message}`);
        }
        else if (command === 'trigger-test') {
            const response = await sendDevToolsRequestAsync(client, 'triggerBackgroundTasks');
            if (response.method === 'error') {
                throw new Error(response.error);
            }
            console.info(`${blue(app.title)}: ${response.message}`);
        }
    }
    finally {
        await client.closeAsync();
    }
});
