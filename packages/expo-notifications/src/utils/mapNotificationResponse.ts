import { NotificationResponse } from '../Notifications.types';

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
  const mappedResponse: NotificationResponse & {
    notification: { request: { content: { dataString?: string } } };
  } = { ...response };
  try {
    const dataString = mappedResponse?.notification?.request?.content['dataString'];
    if (typeof dataString === 'string') {
      mappedResponse.notification.request.content.data = JSON.parse(dataString);
      delete mappedResponse.notification.request.content.dataString;
    }
  } catch (e: any) {
    console.log(`Error in response: ${e}`);
  }
  console.log(`response received: ${JSON.stringify(mappedResponse, null, 2)}`);
  return mappedResponse;
};
