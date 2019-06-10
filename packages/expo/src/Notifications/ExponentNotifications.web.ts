import {
  Notification,
  LocalNotification,
  Channel,
  ActionType,
  LocalNotificationId,
} from './Notifications.types';

function guardPermission() {
  if (!('Notification' in window)) {
    throw new Error('The Notification API is not available on this device.');
  }
  if (!navigator.serviceWorker) {
    throw new Error(
      'Notifications cannot be sent because the Service Worker API is not supported on this device.'
    );
  }
  if (Notification.permission !== 'granted') {
    throw new Error(
      'Cannot use Notifications without permissions. Please request permissions with `expo-permissions`'
    );
  }
}

function transformLocalNotification(
  notification: LocalNotification
): [string, NotificationOptions] {
  const { web = {}, ...abstractNotification } = notification;
  const nativeNotification = {
    ...abstractNotification,
    ...web,
  };
  return [nativeNotification.title, nativeNotification];
}

export default {
  async getExponentPushTokenAsync(): Promise<string> {
    return '';
  },
  async getDevicePushTokenAsync(config: { [key: string]: any }): Promise<void> {},
  async createChannel(channelId: string, channel: string): Promise<void> {},
  async deleteChannel(channelId: string): Promise<void> {},
  async presentLocalNotification(notification: LocalNotification): Promise<LocalNotificationId> {
    guardPermission();

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      throw new Error('Failed to get notification registration!');
    }
    registration.showNotification(...transformLocalNotification(notification));
    return '';
  },
  async presentLocalNotificationWithChannel(notification: any, channelId: string): Promise<void> {},
  async scheduleLocalNotification(
    notification: any,
    options: { [key: string]: any }
  ): Promise<void> {},
  async scheduleLocalNotificationWithChannel(
    notification: any,
    options: { [key: string]: any },
    channelId: string
  ): Promise<void> {},
  async dismissNotification(notificationId: string): Promise<void> {},
  async dismissAllNotifications(): Promise<void> {},
  async cancelScheduledNotification(notificationId: string): Promise<void> {},
  async cancelAllScheduledNotifications(): Promise<void> {},
  //   getBadgeNumberAsync(): Promise<void> {},
  //   setBadgeNumberAsync(badgeNumber: number): Promise<void> {},
};
