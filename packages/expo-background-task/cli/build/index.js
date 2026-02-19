"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const devtools_1 = require("@expo/devtools");
const chalk_1 = __importDefault(require("chalk"));
const PLUGIN_NAME = 'expo-background-task-cli-extension';
const GET_REGISTERED_TASKS = 'getRegisteredBackgroundTasks';
const TRIGGER_TASKS = 'triggerBackgroundTasks';
(0, devtools_1.runCliExtension)(async ({ command, metroServerOrigin }, console) => {
    const apps = await (0, devtools_1.queryAllInspectorAppsAsync)(metroServerOrigin);
    if (apps.length === 0) {
        console.error(`No connected apps found at ${metroServerOrigin}`);
        return;
    }
    if (command === 'list') {
        try {
            const response = await (0, devtools_1.sendCliMessageAsync)(GET_REGISTERED_TASKS, PLUGIN_NAME, apps);
            Object.keys(response).forEach((appId) => {
                const app = apps.find((a) => a.id === appId);
                console.info(`${chalk_1.default.blue(app?.title ?? appId)}: ${response[appId] ?? ''}`);
            });
        }
        catch (error) {
            throw new Error('An error occured connecting to the app.', { cause: error });
        }
    }
    else if (command === 'trigger-test') {
        // Trigger background tasks
        try {
            const response = await (0, devtools_1.sendCliMessageAsync)(TRIGGER_TASKS, PLUGIN_NAME, apps);
            Object.keys(response).forEach((appId) => {
                const app = apps.find((a) => a.id === appId);
                console.info(`${chalk_1.default.blue(app?.title ?? appId)}: ${response[appId] ?? ''}`);
            });
        }
        catch (error) {
            throw new Error('An error occured connecting to the app.', { cause: error });
        }
    }
});
