import { UnavailabilityError } from '@unimodules/core';

import NotificationCategoriesModule from './NotificationCategoriesModule.native';
import { NotificationCategory, NotificationAction } from './Notifications.types';

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

  return await NotificationCategoriesModule.setNotificationCategoryAsync(
    identifier,
    actions,
    options
  );
}
