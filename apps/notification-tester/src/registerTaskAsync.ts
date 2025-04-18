import * as Notifications from 'expo-notifications';
import {
  addNotificationResponseReceivedListener,
  setNotificationHandler,
  Notification,
} from 'expo-notifications';
import { defineTask } from 'expo-task-manager';
import { AppState, Platform } from 'react-native';

import { addItemToStorage } from './misc/addItemToStorage';

// TODO vonovak this API works on iOS but is awkward to have this on module level
addNotificationResponseReceivedListener((response) => {
  addItemToStorage({
    source: 'ROOT_RESPONSE_RECEIVED',
    data: {
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
      data: { notification: { text: text.slice(0, 25) + '...' } },
    });
  } catch (e) {
    // addItemToStorage({
    //   source: 'ROOT_RESPONSE_RECEIVED_DATA_ERROR',
    //   data: {
    //     text: (e as Error).message,
    //   },
    // });
  }
}

let topLevelNumber = 0;
export const registerTask = () => {
  // Background task
  // https://github.com/expo/expo/tree/main/packages/expo-notifications#handling-incoming-notifications-when-the-app-is-not-in-the-foreground-not-supported-in-expo-go
  const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';
  console.log(`Registering task ${BACKGROUND_NOTIFICATION_TASK}`);

  // define task
  defineTask<Notification>(BACKGROUND_NOTIFICATION_TASK, async (params) => {
    const data = params.data;
    console.log(
      `${Platform.OS} ${BACKGROUND_NOTIFICATION_TASK}: App in ${
        AppState.currentState
      } state. data: ${JSON.stringify(data, null, 2)}`
    );
    ++topLevelNumber;
    // @ts-ignore
    const categoryIdentifier = data.aps?.category ?? data?.data?.categoryId;
    // @ts-ignore
    const expoData = data.body ? data.body : JSON.parse(data.data?.body);

    // if (categoryIdentifier) {
    //   // present a corresponding notification when android is not in the foreground
    //   const id = await Notifications.scheduleNotificationAsync({
    //     content: {
    //       // @ts-ignore
    //       title: expoData?.title ?? 'unknown',
    //       body: JSON.stringify(
    //         {
    //           time: new Date().toISOString(),
    //           appState: AppState.currentState,
    //           topLevelNumber,
    //           data,
    //         },
    //         null,
    //         2
    //       ),
    //       categoryIdentifier,
    //       data: {
    //         hello: 'there',
    //         presented: true,
    //       },
    //     },
    //     trigger: null,
    //   });
    //   console.log('Scheduled notification with id:', id);
    // }

    addItemToStorage({
      source: 'BACKGROUND_TASK_RAN',
      data,
    });
    doSomeAsyncWork('BG_ASYNC_TASK_DATA');
  });

  // then register the task
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(console.error);

  // set the notification handler
  setNotificationHandler({
    handleNotification: async (notification) => {
      // addItemToStorage({
      //   source: 'setNotificationHandler',
      //   data: notification,
      // });
      const categoryIdentifier = notification.request.content.data?.['categoryId'];
      if (categoryIdentifier) {
        console.log(
          `Ignoring notification with categoryIdentifier: ${categoryIdentifier} in ${AppState.currentState} state.
          It will be handled by the background task.`
        );
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

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
