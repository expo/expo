import { queryAllInspectorAppsAsync, runCliExtension, sendCliMessageAsync } from '@expo/devtools';

const EXTENSION_NAME = 'expo-sqlite-cli-extension';

const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;

runCliExtension<{
  list_databases: Record<string, never>;
  get_database: { name: string };
  execute_query: { name: string; query: string };
  list_tables: { name: string };
  get_table_schema: { name: string; table: string };
}>(async ({ command, metroServerOrigin, args, app }, console) => {
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
      } catch (error) {
        throw new Error('An error occured connecting to the app.', { cause: error });
      }
      break;
    }
    case 'execute_query': {
      try {
        const response = await sendCliMessageAsync<{ name: string; query: string }>(
          'executeQuery',
          EXTENSION_NAME,
          app,
          args
        );
        console.info(`${blue(app.title)}: ${response}`);
      } catch (error) {
        throw new Error('An error occured connecting to the app.', { cause: error });
      }
      break;
    }
    case 'list_tables': {
      try {
        const response = await sendCliMessageAsync<{ name: string }>(
          'listTables',
          EXTENSION_NAME,
          app,
          args
        );
        console.info(`${blue(app.title)}: ${response}`);
      } catch (error) {
        throw new Error('An error occured connecting to the app.', { cause: error });
      }
      break;
    }
    case 'get_table_schema': {
      try {
        const response = await sendCliMessageAsync<{ name: string; table: string }>(
          'getTableSchema',
          EXTENSION_NAME,
          app,
          args
        );
        console.info(`${blue(app.title)}: ${response}`);
      } catch (error) {
        throw new Error('An error occured connecting to the app.', { cause: error });
      }
      break;
    }
    default:
      console.error(`Unknown command: ${command}`);
  }
});
