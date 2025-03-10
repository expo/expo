import * as Notifications from 'expo-notifications';
import {
  addNotificationResponseReceivedListener,
  setNotificationHandler,
} from 'expo-notifications';
import { defineTask } from 'expo-task-manager';
import { AppState, Platform } from 'react-native';

import { addItemToStorage } from './addItemToStorage';

// TODO vonovak this API works on iOS but is awkward to have this on module level
addNotificationResponseReceivedListener((response) => {
  addItemToStorage({
    source: 'ROOT_RESPONSE_RECEIVED',
    notification: {
      actionIdentifier: response.actionIdentifier,
      userText: response.userText,
    },
  });
  doSomeAsyncWork('ROOT_RESPONSE_RECEIVED_DATA');
});

async function doSomeAsyncWork(source: string) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    const text = await response.text();
    addItemToStorage({
      source,
      notification: {
        text: text.slice(0, 25),
      },
    });
  } catch (e) {
    addItemToStorage({
      source: 'ROOT_RESPONSE_RECEIVED_DATA_ERROR',
      notification: {
        text: (e as Error).message,
      },
    });
  }
}

let topLevelNumber = 0;
export const registerTask = () => {
  // Background task
  // https://github.com/expo/expo/tree/main/packages/expo-notifications#handling-incoming-notifications-when-the-app-is-not-in-the-foreground-not-supported-in-expo-go
  const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK_NOTIFIER';
  console.log(`Registering task ${BACKGROUND_NOTIFICATION_TASK}`);

  // define task
  defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    console.log(
      `${Platform.OS} ${BACKGROUND_NOTIFICATION_TASK}: App in ${
        AppState.currentState
      } state. data: ${JSON.stringify(data, null, 2)}`
    );
    ++topLevelNumber;
    // @ts-ignore
    const categoryIdentifier = data.aps?.category ?? data?.data?.categoryId;
    if (categoryIdentifier) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Here is a scheduled notification!',
          body: JSON.stringify(
            {
              time: new Date().toISOString(),
              appState: AppState.currentState,
              topLevelNumber,
              categoryIdentifier,
              data,
            },
            null,
            2
          ),
          categoryIdentifier,
          data: {
            hello: 'there',
          },
        },
        trigger: null,
      });
      console.log('Scheduled notification with id:', id);
    }

    addItemToStorage({
      source: BACKGROUND_NOTIFICATION_TASK,
      notification: data,
    });
    doSomeAsyncWork('BG_TASK_DATA');
  });

  // then register the task
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(console.error);

  // set the notification handler
  setNotificationHandler({
    handleNotification: async (notification) => {
      addItemToStorage({
        source: 'setNotificationHandler',
        notification,
      });

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
    handleSuccess: (id) => {
      console.log(`Notification handled successfully: ${id}`);
    },
    handleError: (id, error) => {
      console.error(`Notification handling failed: ${id}`, error);
    },
  });
};
