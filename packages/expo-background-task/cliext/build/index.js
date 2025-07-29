"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devtools_1 = require("expo/devtools");
const PLUGIN_NAME = 'expo-backgroundtask-devtools-plugin';
const GET_REGISTERED_TASKS = 'getRegisteredBackgroundTasks';
const TRIGGER_TASKS = 'triggerBackgroundTasks';
(0, devtools_1.cliExtension)(async (command, _args, metroServerOrigin) => {
    const apps = await (0, devtools_1.queryAllInspectorAppsAsync)(metroServerOrigin);
    if (apps.length === 0) {
        throw new Error('No apps connected to the dev server. Please connect an app to use this command.');
    }
    if (command === 'list') {
        try {
            return [
                { type: 'text', text: await (0, devtools_1.sendMessageAsync)(GET_REGISTERED_TASKS, PLUGIN_NAME, apps) },
            ];
        }
        catch (error) {
            throw new Error('An error occured connecting to the app:' + error.toString());
        }
    }
    else if (command === 'test') {
        // Trigger background tasks
        try {
            return [{ type: 'text', text: await (0, devtools_1.sendMessageAsync)(TRIGGER_TASKS, PLUGIN_NAME, apps) }];
        }
        catch (error) {
            throw new Error('An error occured connecting to the app:' + error.toString());
        }
    }
    else {
        return Promise.reject(new Error("Unknown command. Use 'list' to see available tasks or 'trigger' to run a task."));
    }
});
//# sourceMappingURL=index.js.map