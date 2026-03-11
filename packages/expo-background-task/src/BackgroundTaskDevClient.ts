import type { DevToolsPluginClient } from 'expo/devtools';
import * as TaskManager from 'expo-task-manager';

import { triggerTaskWorkerForTestingAsync } from './BackgroundTask';

const PLUGIN_NAME = 'expo-background-task';

let devtoolsClient: DevToolsPluginClient | null = null;

export async function maybeInitDevToolsAsync(): Promise<void> {
  if (!__DEV__ || devtoolsClient) return;
  try {
    const { getDevToolsPluginClientAsync } =
      require('expo/devtools') as typeof import('expo/devtools');
    devtoolsClient = await getDevToolsPluginClientAsync(PLUGIN_NAME);

    devtoolsClient.addMessageListener(
      'triggerBackgroundTasks',
      async (params: { requestId: string }) => {
        try {
          const tasks = await TaskManager.getRegisteredTasksAsync();
          if (tasks.length === 0) {
            devtoolsClient?.sendMessage('response', {
              requestId: params.requestId,
              method: 'triggerBackgroundTasks',
              message: 'No background tasks registered to trigger.',
            });
            return;
          }
          await triggerTaskWorkerForTestingAsync();
          devtoolsClient?.sendMessage('response', {
            requestId: params.requestId,
            method: 'triggerBackgroundTasks',
            message: `${tasks.length} tasks triggered successfully.`,
          });
        } catch (error: unknown) {
          devtoolsClient?.sendMessage('response', {
            requestId: params.requestId,
            method: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    );

    devtoolsClient.addMessageListener(
      'getRegisteredBackgroundTasks',
      async (params: { requestId: string }) => {
        try {
          const tasks = await TaskManager.getRegisteredTasksAsync();
          const message =
            tasks.length === 0
              ? 'No background tasks registered.'
              : `${tasks.length} task(s): ${tasks.map((task) => `"${task.taskName}"`).join(', ')}.`;
          devtoolsClient?.sendMessage('response', {
            requestId: params.requestId,
            method: 'getRegisteredBackgroundTasks',
            message,
          });
        } catch (error: unknown) {
          devtoolsClient?.sendMessage('response', {
            requestId: params.requestId,
            method: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    );
  } catch (error) {
    console.error('Failed to start app listeners for expo-backgroundtask-devtools-plugin:', error);
  }
}
