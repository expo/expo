import { UnavailabilityError } from '@unimodules/core';

import NotificationPresenter from './NotificationPresenterModule';

export default async function dismissNotificationAsync(
  notificationIdentifier: string
): Promise<void> {
  if (!NotificationPresenter.dismissNotificationAsync) {
    throw new UnavailabilityError('Notifications', 'dismissNotificationAsync');
  }

  return await NotificationPresenter.dismissNotificationAsync(notificationIdentifier);
}
