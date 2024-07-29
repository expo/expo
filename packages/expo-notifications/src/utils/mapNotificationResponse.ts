import { Notification, NotificationResponse } from '../Notifications.types';

/**
 * @hidden
 *
 * Does any required processing of a notification response from native code
 * before it is passed to a notification response listener, or to the
 * last notification response hook.
 *
 * @param response The raw response passed in from native code
 * @returns the mapped response.
 */
export const mapNotificationResponse = (response: NotificationResponse) => {
  return {
    ...response,
    notification: mapNotification(response.notification),
  };
};

/**
 * @hidden
 *
 * Does any required processing of a notification from native code
 * before it is passed to a notification listener.
 *
 * @param notification The raw notification passed in from native code
 * @returns the mapped notification.
 */
export const mapNotification = (notification: Notification) => {
  const mappedNotification: Notification & {
    request: { content: { dataString?: string } };
  } = { ...notification };
  try {
    const dataString = mappedNotification?.request?.content['dataString'];
    if (typeof dataString === 'string') {
      mappedNotification.request.content.data = JSON.parse(dataString);
      delete mappedNotification.request.content.dataString;
    }
  } catch (e: any) {
    console.log(`Error in notification: ${e}`);
  }
  return mappedNotification;
};
