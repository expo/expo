import { UnavailabilityError } from 'expo-modules-core';

import NotificationPresenter from './NotificationPresenterModule';

/**
 * Removes all application's notifications displayed in the notification tray (Notification Center).
 * @return A Promise which resolves once the request to dismiss the notifications is successfully dispatched to the notifications manager.
 * @header dismiss
 */
export default async function dismissAllNotificationsAsync(): Promise<void> {
  if (!NotificationPresenter.dismissAllNotificationsAsync) {
    throw new UnavailabilityError('Notifications', 'dismissAllNotificationsAsync');
  }

  return await NotificationPresenter.dismissAllNotificationsAsync();
}
