import { cliExtension, sendMessageAsync } from 'expo/devtools';

const PLUGIN_NAME = 'expo-backgroundtask-devtools-plugin';
const GET_REGISTERED_TASKS = 'getRegisteredBackgroundTasks';
const TRIGGER_TASKS = 'triggerBackgroundTasks';

cliExtension<{ list: Record<string, never>; test: Record<string, never> }>(
  async (command, _args, apps) => {
    if (apps.length === 0) {
      throw new Error(
        'No apps connected to the dev server. Please connect an app to use this command.'
      );
    }

    if (command === 'list') {
      try {
        return [
          { type: 'text', text: await sendMessageAsync(GET_REGISTERED_TASKS, PLUGIN_NAME, apps) },
        ];
      } catch (error: any) {
        throw new Error('An error occured connecting to the app:' + error.toString());
      }
    } else if (command === 'test') {
      // Trigger background tasks
      try {
        return [{ type: 'text', text: await sendMessageAsync(TRIGGER_TASKS, PLUGIN_NAME, apps) }];
      } catch (error: any) {
        throw new Error('An error occured connecting to the app:' + error.toString());
      }
    } else {
      return Promise.reject(
        new Error("Unknown command. Use 'list' to see available tasks or 'trigger' to run a task.")
      );
    }
  }
);
