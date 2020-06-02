import { UnavailabilityError } from '@unimodules/core';

import NotificationPresenter from './NotificationPresenter';

export default async function deleteCategoryAsync(
  categoryId: string
): Promise<void> {
  if (!NotificationPresenter.deleteCategoryAsync) {
    throw new UnavailabilityError('Notifications', 'deleteCategoryAsync');
  }

  return await NotificationPresenter.deleteCategoryAsync(categoryId);
}
