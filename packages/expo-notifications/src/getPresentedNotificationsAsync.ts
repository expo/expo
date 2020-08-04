import { UnavailabilityError } from '@unimodules/core';

import NotificationPresenter from './NotificationPresenterModule';
import { Notification } from './Notifications.types';

export default async function getPresentedNotificationsAsync(): Promise<Notification[]> {
  if (!NotificationPresenter.getPresentedNotificationsAsync) {
    throw new UnavailabilityError('Notifications', 'getPresentedNotificationsAsync');
  }

  return await NotificationPresenter.getPresentedNotificationsAsync();
}
