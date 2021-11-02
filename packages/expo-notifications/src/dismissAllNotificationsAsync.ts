import { UnavailabilityError } from 'expo-modules-core';

import NotificationPresenter from './NotificationPresenterModule';

export default async function dismissAllNotificationsAsync(): Promise<void> {
  if (!NotificationPresenter.dismissAllNotificationsAsync) {
    throw new UnavailabilityError('Notifications', 'dismissAllNotificationsAsync');
  }

  return await NotificationPresenter.dismissAllNotificationsAsync();
}
