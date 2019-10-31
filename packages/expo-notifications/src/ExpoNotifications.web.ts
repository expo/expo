import UUID from 'uuid-js';

import { LocalNotification } from './Notifications.types';

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
  async presentLocalNotification(notification: LocalNotification): Promise<string> {
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
};
