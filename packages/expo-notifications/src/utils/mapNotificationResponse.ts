import {
  Notification,
  NotificationContent,
  NotificationRequest,
  NotificationResponse,
} from '../Notifications.types';

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
export const mapNotification = (notification: Notification) => ({
  ...notification,
  request: mapNotificationRequest(notification.request),
});

/**
 * @hidden
 *
 * Does any required processing of a notification request from native code
 * before it is passed to other JS code.
 *
 * @param request The raw request passed in from native code
 * @returns the mapped request.
 */
export const mapNotificationRequest = (request: NotificationRequest) => ({
  ...request,
  content: mapNotificationContent(request.content),
});

/**
 * @hidden
 * Does any required processing of notification content from native code
 * before being passed to other JS code.
 *
 * @param content The raw content passed in from native code
 * @returns the mapped content.
 */
export const mapNotificationContent = (content: NotificationContent) => {
  const mappedContent: NotificationContent & { dataString?: string } = { ...content };
  try {
    const dataString = mappedContent['dataString'];
    if (typeof dataString === 'string') {
      mappedContent.data = JSON.parse(dataString);
      delete mappedContent.dataString;
    }
  } catch (e: any) {
    console.log(`Error in notification: ${e}`);
  }
  return mappedContent;
};
