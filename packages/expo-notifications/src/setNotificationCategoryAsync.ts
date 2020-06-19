import { UnavailabilityError, Platform } from '@unimodules/core';

import NotificationCategoriesModule from './NotificationCategoriesModule';
import { NotificationCategory } from './Notifications.types';

export default async function setNotificationCategoryAsync(
  identifier: string,
  actions: NotificationAction[],
  options?: {
    previewPlaceholder?: string;
    intentIdentifiers?: string[];
    categorySummaryFormat?: string;
    customDismissAction?: boolean;
    allowInCarPlay?: boolean;
    showTitle?: boolean;
    showSubtitle?: boolean;
    allowAnnouncment?: boolean;
  }
): Promise<NotificationCategory> {
  if (!NotificationCategoriesModule.setNotificationCategoryAsync) {
    throw new UnavailabilityError('Notifications', 'setNotificationCategoryAsync');
  }

  return Platform.OS === 'ios'
    ? await NotificationCategoriesModule.setNotificationCategoryAsync(identifier, actions, options)
    : await NotificationCategoriesModule.setNotificationCategoryAsync(identifier, actions);
}
