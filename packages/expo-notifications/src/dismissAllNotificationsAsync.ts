import { UnavailabilityError } from '@unimodules/core';

import NotificationPresenter from './NotificationPresenter';

export default async function dismissAllNotificationsAsync(): Promise<void> {
  if (!NotificationPresenter.dismissAllNotificationsAsync) {
    throw new UnavailabilityError('Notifications', 'dismissAllNotificationsAsync');
  }

  return await NotificationPresenter.dismissAllNotificationsAsync();
}
