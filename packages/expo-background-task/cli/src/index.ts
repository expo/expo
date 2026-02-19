import { queryAllInspectorAppsAsync, runCliExtension, sendCliMessageAsync } from '@expo/devtools';

const PLUGIN_NAME = 'expo-background-task-cli-extension';
const GET_REGISTERED_TASKS = 'getRegisteredBackgroundTasks';
const TRIGGER_TASKS = 'triggerBackgroundTasks';

const blue = (s: string) => `\x1b[34m${s}\x1b[0m`;

runCliExtension<{
  list: Record<string, never>;
  'trigger-test': Record<string, never>;
}>(async ({ command, metroServerOrigin }, console) => {
  const apps = await queryAllInspectorAppsAsync(metroServerOrigin);
  if (apps.length === 0) {
    console.error(`No connected apps found at ${metroServerOrigin}`);
    return;
  }

  if (command === 'list') {
    try {
      const response = await sendCliMessageAsync(GET_REGISTERED_TASKS, PLUGIN_NAME, apps);
      Object.keys(response).forEach((appId) => {
        const app = apps.find((a) => a.id === appId);
        console.info(`${blue(app?.title ?? appId)}: ${response[appId] ?? ''}`);
      });
    } catch (error) {
      throw new Error('An error occured connecting to the app.', { cause: error });
    }
  } else if (command === 'trigger-test') {
    // Trigger background tasks
    try {
      const response = await sendCliMessageAsync(TRIGGER_TASKS, PLUGIN_NAME, apps);
      Object.keys(response).forEach((appId) => {
        const app = apps.find((a) => a.id === appId);
        console.info(`${blue(app?.title ?? appId)}: ${response[appId] ?? ''}`);
      });
    } catch (error) {
      throw new Error('An error occured connecting to the app.', { cause: error });
    }
  }
});
