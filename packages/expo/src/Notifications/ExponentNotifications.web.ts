import { CodedError } from '@unimodules/core';
import Constants from 'expo-constants';
import UUID from 'uuid-js';

import { LocalNotification, LocalNotificationId } from './Notifications.types';

function guardPermission() {
  if (!('Notification' in window)) {
    throw new Error('The Notification API is not available on this device.');
  }
  if (!navigator.serviceWorker) {
    throw new Error(
      'Notifications cannot be sent because the service worker API is not supported on this device.'
    );
  }
  if (!navigator.serviceWorker.controller) {
    throw new Error(
      'Notifications cannot be sent because there is no service worker controller registered. Ensure you have SSL certificates enabled.'
    );
  }
  if (Notification.permission !== 'granted') {
    throw new Error(
      'Cannot use Notifications without permissions. Please request permissions with `expo-permissions`'
    );
  }
}

function transformLocalNotification(
  notification: LocalNotification,
  tag: string
): [string, NotificationOptions] {
  const { web = {}, ...abstractNotification } = notification;
  tag = web.tag || tag;
  const nativeNotification = {
    ...abstractNotification,
    tag,
    ...web,
  };
  return [nativeNotification.title, nativeNotification];
}

function generateID(): string {
  return UUID.create().toString();
}

async function getRegistrationAsync(): Promise<ServiceWorkerRegistration> {
  guardPermission();
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    throw new Error('Failed to get notification registration!');
  }
  return registration;
}

async function getNotificationsAsync(tag?: string): Promise<Notification[]> {
  const registration = await getRegistrationAsync();
  const notifications = await registration.getNotifications(tag ? { tag } : undefined);
  return notifications;
}

export default {
  async presentLocalNotification(notification: LocalNotification): Promise<LocalNotificationId> {
    const registration = await getRegistrationAsync();
    const tag = generateID();
    registration.showNotification(...transformLocalNotification(notification, tag));
    return tag;
  },
  async scheduleLocalNotification(
    notification: any,
    options: {
      time?: Date | number;
      repeat?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
      intervalMs?: number;
    } = {}
  ): Promise<string> {
    if (options.intervalMs) {
      const registration = await getRegistrationAsync();
      const tag = generateID();
      setTimeout(() => {
        registration.showNotification(...transformLocalNotification(notification, tag));
      }, options.intervalMs);
      return tag;
    } else if (options.time) {
      const intervalMs = (options.time as number) - Date.now();
      if (intervalMs < 0) {
        throw new Error(
          'Expo.Notifications.scheduleLocalNotification(): options.time must be some time in the future.'
        );
      }
      return this.scheduleLocalNotification(notification, {
        intervalMs,
      });
    }
    throw new Error(
      `Expo.Notifications.scheduleLocalNotification() options ${JSON.stringify(
        options,
        null,
        2
      )} are not supported yet.`
    );
  },

  async dismissNotification(notificationId?: string): Promise<void> {
    const notifications = await getNotificationsAsync(notificationId);
    for (const notification of notifications) {
      notification.close();
    }
  },
  async dismissAllNotifications(): Promise<void> {
    this.dismissNotification();
  },
  async cancelScheduledNotificationAsync(notificationId: string): Promise<void> {
    this.dismissNotification(notificationId);
  },
  async cancelAllScheduledNotificationsAsync(): Promise<void> {
    this.dismissNotification();
  },

  async getExponentPushTokenAsync(): Promise<string> {
    if (!Constants.manifest.owner || !Constants.manifest.slug) {
      throw new CodedError(
        'ERR_WEB_PUSH_NOTIFICATIONS_MISSING_CONFIG',
        'You must provide `owner` and `slug` in `app.json` to use push notifications on web. Read more here: https://docs.expo.io/versions/latest/guides/using-vapid/.'
      );
    }

    const data = await _subscribeUserToPushAsync();
    const experienceId = `@${Constants.manifest.owner}/${Constants.manifest.slug}`;
    const tokenArguments: { [key: string]: string } = {
      deviceId: Constants.installationId,
      experienceId: experienceId,
      // Also uses `experienceId` for `appId` because there's no `appId` for web.
      appId: experienceId,
      deviceToken: JSON.stringify(data),
      type: 'web',
    };

    // TODO: Use production URL
    const response = await fetch('http://expo.test/--/api/v2/push/getExpoPushToken', {
      method: 'POST',
      body: JSON.stringify(tokenArguments),
    }).then(response => response.json());

    // TODO: Error handling
    return response.data.expoPushToken;
  },

  async getDevicePushTokenAsync(): Promise<{ type: string; data: Object }> {
    const data = await _subscribeUserToPushAsync();
    return { type: 'web', data: data };
  },
};

async function _subscribeUserToPushAsync(): Promise<Object> {
  if (!Constants.manifest.notification || !Constants.manifest.notification.vapidPublicKey) {
    throw new CodedError(
      'ERR_WEB_PUSH_NOTIFICATIONS_MISSING_CONFIG',
      'You must provide `notification.vapidPublicKey` in `app.json` to use push notifications on web. Read more here: https://docs.expo.io/versions/latest/guides/using-vapid/.'
    );
  }

  const registration = await navigator.serviceWorker.register('/service-worker.js');
  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: _urlBase64ToUint8Array(Constants.manifest.notification.vapidPublicKey),
  };
  const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
  const pushSubscriptionJson = pushSubscription.toJSON();

  const subscriptionObject = {
    endpoint: pushSubscriptionJson.endpoint,
    keys: {
      p256dh: pushSubscriptionJson.keys!.p256dh,
      auth: pushSubscriptionJson.keys!.auth,
    },
  };
  console.log('subscriptionObject: ', JSON.stringify(subscriptionObject));
  return subscriptionObject;
}

// https://github.com/web-push-libs/web-push#using-vapid-key-for-applicationserverkey
function _urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
