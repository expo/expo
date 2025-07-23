import * as Notifications from 'expo-notifications';
import {
  addNotificationResponseReceivedListener,
  setNotificationHandler,
  NotificationTaskPayload,
} from 'expo-notifications';
import { defineTask } from 'expo-task-manager';
import { AppState, Platform } from 'react-native';

import { addItemToStorage } from './misc/addItemToStorage';
import { CATEGORY_ID } from './misc/constants';

function shouldBeHandledByTask(categoryIdentifier?: string | null | unknown) {
  // it's tricky to present notifications with action button across platforms
  // due to how notification service now works. You could achieve this by:
  // const messageTemplate: TestMessage = {
  //   to: '', // Will be replaced by the real push tokens
  //   ttl: 60 * 60 * 24, // 1 day
  //   priority: 'high',
  //   categoryId: CATEGORY_ID,
  //   _contentAvailable: true,
  //   data: {
  //     title: 'hello how are you',
  //     someMockKey: 123,
  //   },
  // }
  return categoryIdentifier === CATEGORY_ID;
}

// TODO vonovak this API works on iOS but is awkward to have this on module level
addNotificationResponseReceivedListener((response) => {
  addItemToStorage({
    source: 'ROOT_RESPONSE_RECEIVED',
    data: {
      actionIdentifier: response.actionIdentifier,
      userText: response.userText,
    },
  });
  doSomeAsyncWork('ROOT_RESPONSE_LSNR_RECEIVED_DATA');
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
  defineTask<NotificationTaskPayload>(BACKGROUND_NOTIFICATION_TASK, async (params) => {
    const taskPayload = params.data;
    try {
      console.log(
        `${Platform.OS} ${BACKGROUND_NOTIFICATION_TASK}: App in ${
          AppState.currentState
        } state. data: ${JSON.stringify(taskPayload, null, 2)}`
      );
      ++topLevelNumber;
      const isNotificationResponse = 'actionIdentifier' in taskPayload;
      if (isNotificationResponse) {
        addItemToStorage({
          source: 'BACKGROUND_TASK_RESPONSE_RECEIVED',
          data: taskPayload,
        });
      } else {
        const categoryIdentifier = taskPayload.data.categoryId;
        const expoData = taskPayload.data.dataString && JSON.parse(taskPayload.data.dataString);
        addItemToStorage({
          source: 'BACKGROUND_TASK_NOTIFICATION_RECEIVED',
          data: taskPayload,
        });

        if (shouldBeHandledByTask(categoryIdentifier)) {
          // present the corresponding notification when android is not in the foreground
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: expoData?.title ?? 'unknown',
              body: JSON.stringify(
                {
                  time: new Date().toISOString(),
                  appState: AppState.currentState,
                  topLevelNumber,
                },
                null,
                2
              ),
              categoryIdentifier,
              data: {
                hello: 'there',
                presented: true,
              },
            },
            trigger: null,
          });
          console.log('Scheduled notification with id:', id);
        }
      }

      doSomeAsyncWork('BG_ASYNC_FETCH_RESULT');
    } catch (err: any) {
      addItemToStorage({
        source: 'BACKGROUND_TASK_ERR',
        data: { err: err.toString(), payload: JSON.stringify(taskPayload, null, 2) },
      });
    }
  });

  // then register the task
  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(console.error);

  // set the notification handler
  setNotificationHandler({
    handleNotification: async (notification) => {
      const categoryIdentifier = notification.request.content.categoryIdentifier;
      if (shouldBeHandledByTask(categoryIdentifier)) {
        console.log(
          `Ignoring notification with categoryIdentifier: ${categoryIdentifier} in ${AppState.currentState} state.
          It will be handled by the background task.`
        );
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }

      return {
        shouldShowBanner: true,
        shouldShowList: true,
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
