import { UnavailabilityError } from 'expo';

import NotificationCategoriesModule from './NotificationCategoriesModule';
import type { NotificationCategory } from './Notifications.types';

/**
 * Replaces all notification categories with the provided categories. Pass an empty array to remove all categories.
 * In Expo Go, this replaces only the categories of the current project.
 * This is the recommended way to register notification categories. Call it during app initialization
 * with the complete list of categories your app supports.
 * @param categories The complete set of notification categories. Each category must have a unique identifier.
 * > Don't use the characters `:` or `-` in category identifiers. If you do, categories might not work as expected.
 * @return A Promise that resolves when the categories have been replaced.
 * @platform android
 * @platform ios
 * @header categories
 */
export async function setNotificationCategoriesAsync(
  categories: NotificationCategory[]
): Promise<void> {
  if (!NotificationCategoriesModule.setNotificationCategoriesAsync) {
    throw new UnavailabilityError('Notifications', 'setNotificationCategoriesAsync');
  }

  await NotificationCategoriesModule.setNotificationCategoriesAsync(categories);
}
