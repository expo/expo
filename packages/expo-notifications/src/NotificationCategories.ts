import { UnavailabilityError, Platform } from '@unimodules/core';

import NotificationCategoriesModule from './NotificationCategoriesModule';
import { NotificationAction, NotificationCategory } from './Notifications.types';

export async function getNotificationCategoriesAsync(): Promise<NotificationCategory[]> {
  if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
  }

  return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}

export async function setNotificationCategoryAsync(
  name: string,
  actions: NotificationAction[],
  previewPlaceholder?: string
): Promise<void> {
  if (!NotificationCategoriesModule.setNotificationCategoryAsync) {
    throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
  }

  return Platform.OS === 'ios'
    ? await NotificationCategoriesModule.setNotificationCategoryAsync(
        name,
        actions,
        previewPlaceholder
      )
    : await NotificationCategoriesModule.setNotificationCategoryAsync(name, actions);
}

export async function deleteNotificationCategoryAsync(identifier: string): Promise<void> {
  if (!NotificationCategoriesModule.deleteNotificationCategoryAsync) {
    throw new UnavailabilityError('Notifications', 'deleteNotificationCategoryAsync');
  }

  return await NotificationCategoriesModule.deleteNotificationCategoryAsync(identifier);
}
