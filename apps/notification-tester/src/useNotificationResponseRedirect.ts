import {
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
  NotificationResponse,
} from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { addItemToStorage } from './misc/addItemToStorage';

export function useNotificationResponseRedirect() {
  useEffect(() => {
    let isMounted = true;

    addItemToStorage({
      source: 'MOUNT_EFFECT_RAN',
      data: { type: 'empty' },
    });

    function redirect(response: NotificationResponse) {
      addItemToStorage({
        source: 'MOUNT_RESPONSE_RECEIVED',
        data: { id: response.actionIdentifier, text: response.userText },
      });
      const url = response?.notification.request.content.data?.url;
      if (url) {
        // @ts-expect-error: string is not assignable to router urls
        router.push(url);
      }
    }

    getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response) {
        return;
      }
      redirect(response);
    });

    const subscription = addNotificationResponseReceivedListener((response) => {
      redirect(response);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}
