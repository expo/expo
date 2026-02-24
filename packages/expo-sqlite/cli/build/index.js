"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devtools_1 = require("@expo/devtools");
const EXTENSION_NAME = 'expo-sqlite-cli-extension';
const blue = (s) => `\x1b[34m${s}\x1b[0m`;
(0, devtools_1.runCliExtension)(async ({ command, metroServerOrigin, args }, console) => {
    const apps = await (0, devtools_1.queryAllInspectorAppsAsync)(metroServerOrigin);
    if (apps.length === 0) {
        console.error(`No connected apps found at ${metroServerOrigin}`);
        return;
    }
    if (command === 'list_databases') {
        try {
            const response = await (0, devtools_1.sendCliMessageAsync)('listDatabases', EXTENSION_NAME, apps);
            Object.keys(response).forEach((appId) => {
                const app = apps.find((a) => a.id === appId);
                console.info(`${blue(app?.title ?? appId)}: ${response[appId] ?? ''}`);
            });
        }
        catch (error) {
            throw new Error('An error occured connecting to the app.', { cause: error });
        }
    }
    else if (command === 'execute_query') {
        try {
            const response = await (0, devtools_1.sendCliMessageAsync)('executeQuery', EXTENSION_NAME, apps, args);
            Object.keys(response).forEach((appId) => {
                const app = apps.find((a) => a.id === appId);
                console.info(`${blue(app?.title ?? appId)}: ${response[appId] ?? ''}`);
            });
        }
        catch (error) {
            throw new Error('An error occured connecting to the app.', { cause: error });
        }
    }
    else if (command === 'list_tables') {
        try {
            const response = await (0, devtools_1.sendCliMessageAsync)('listTables', EXTENSION_NAME, apps, args);
            Object.keys(response).forEach((appId) => {
                const app = apps.find((a) => a.id === appId);
                console.info(`${blue(app?.title ?? appId)}: ${response[appId] ?? ''}`);
            });
        }
        catch (error) {
            throw new Error('An error occured connecting to the app.', { cause: error });
        }
    }
    else if (command === 'get_table_schema') {
        try {
            const response = await (0, devtools_1.sendCliMessageAsync)('getTableSchema', EXTENSION_NAME, apps, args);
            Object.keys(response).forEach((appId) => {
                const app = apps.find((a) => a.id === appId);
                console.info(`${blue(app?.title ?? appId)}: ${response[appId] ?? ''}`);
            });
        }
        catch (error) {
            throw new Error('An error occured connecting to the app.', { cause: error });
        }
    }
    else {
        console.error(`Unknown command: ${command}`);
    }
});
