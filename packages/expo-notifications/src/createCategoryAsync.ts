import { UnavailabilityError, Platform } from '@unimodules/core';

import NotificationPresenter from './NotificationPresenter';

import { ActionType } from './Notifications.types';

export default async function createCategoryAsync(
  categoryId: string,
  actions: ActionType[],
  previewPlaceholder?: string | null
): Promise<void> {
  if (!NotificationPresenter.createCategoryAsync) {
    throw new UnavailabilityError('Notifications', 'createCategoryAsync');
  }

  return Platform.OS === 'ios'
    ? await NotificationPresenter.createCategoryAsync(
        categoryId,
        actions,
        // previewPlaceholder || ''
      )
    : (() => {})();
  // FIXME: Implement for Android
  // : await NotificationPresenter.createCategoryAsync(categoryId, actions);
}
