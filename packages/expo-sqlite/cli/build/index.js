import { queryAllInspectorAppsAsync, runCliExtension, sendCliMessageAsync } from '@expo/devtools';
const EXTENSION_NAME = 'expo-sqlite-cli-extension';
const blue = (s) => `\x1b[34m${s}\x1b[0m`;
runCliExtension(async ({ command, metroServerOrigin, args, app }, console) => {
    const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
    if (apps.length === 0) {
        console.error(`No connected apps found at ${metroServerOrigin}`);
        return;
    }
    switch (command) {
        case 'list_databases': {
            try {
                const response = await sendCliMessageAsync('listDatabases', EXTENSION_NAME, app);
                console.info(`${blue(app.title)}: ${response}`);
            }
            catch (error) {
                throw new Error('An error occured connecting to the app.', { cause: error });
            }
            break;
        }
        case 'execute_query': {
            try {
                const response = await sendCliMessageAsync('executeQuery', EXTENSION_NAME, app, args);
                console.info(`${blue(app.title)}: ${response}`);
            }
            catch (error) {
                throw new Error('An error occured connecting to the app.', { cause: error });
            }
            break;
        }
        case 'list_tables': {
            try {
                const response = await sendCliMessageAsync('listTables', EXTENSION_NAME, app, args);
                console.info(`${blue(app.title)}: ${response}`);
            }
            catch (error) {
                throw new Error('An error occured connecting to the app.', { cause: error });
            }
            break;
        }
        case 'get_table_schema': {
            try {
                const response = await sendCliMessageAsync('getTableSchema', EXTENSION_NAME, app, args);
                console.info(`${blue(app.title)}: ${response}`);
            }
            catch (error) {
                throw new Error('An error occured connecting to the app.', { cause: error });
            }
            break;
        }
        default:
            console.error(`Unknown command: ${command}`);
    }
});
