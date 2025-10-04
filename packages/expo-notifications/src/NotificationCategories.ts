import { UnavailabilityError } from 'expo-modules-core';

import NotificationCategoriesModule from './NotificationCategoriesModule';
import {
  NotificationAction,
  NotificationCategory,
  NotificationCategoryOptions,
} from './Notifications.types';

/**
 * Sets the new notification category.
 * @param categories An array of notification categories to set. Each category must have a unique identifier.
 *
 * @return A Promise that resolves once the operation completes.
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
  // TODO Don't use the characters `:` or `-` in your category identifier. If you do, categories might not work as expected.

  await NotificationCategoriesModule.setNotificationCategoriesAsync(categories);
}

/**
 * Sets the new notification category.
 * @param identifier A string to associate as the ID of this category. You will pass this string in as the `categoryIdentifier`
 * in your [`NotificationContent`](#notificationcontent) to associate a notification with this category.
 * > Don't use the characters `:` or `-` in your category identifier. If you do, categories might not work as expected.
 * @param actions An array of [`NotificationAction`](#notificationaction), which describe the actions associated with this category.
 * @param options An optional object of additional configuration options for your category.
 * @return A Promise which resolves to the category you just have created.
 * @platform android
 * @platform ios
 * @header categories
 *
 * @deprecated Use `setNotificationCategoriesAsync` instead.
 */
export async function setNotificationCategoryAsync(
  identifier: string,
  actions: NotificationAction[],
  options?: NotificationCategoryOptions
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

/**
 * Deletes the category associated with the provided identifier.
 * @param identifier Identifier initially provided to `setNotificationCategoryAsync` when creating the category.
 * @return A Promise which resolves to `true` if the category was successfully deleted, or `false` if it was not.
 * An example of when this method would return `false` is if you try to delete a category that doesn't exist.
 * @platform android
 * @platform ios
 * @header categories
 *
 * @deprecated Use `setNotificationCategoriesAsync` instead.
 */
export async function deleteNotificationCategoryAsync(identifier: string): Promise<boolean> {
  if (!NotificationCategoriesModule.deleteNotificationCategoryAsync) {
    throw new UnavailabilityError('Notifications', 'deleteNotificationCategoryAsync');
  }

  return await NotificationCategoriesModule.deleteNotificationCategoryAsync(identifier);
}

/**
 * Fetches information about all known notification categories.
 * @return A Promise which resolves to an array of `NotificationCategory`s. On platforms that do not support notification channels,
 * it will always resolve to an empty array.
 * @platform android
 * @platform ios
 * @header categories
 */
export async function getNotificationCategoriesAsync(): Promise<NotificationCategory[]> {
  if (!NotificationCategoriesModule.getNotificationCategoriesAsync) {
    throw new UnavailabilityError('Notifications', 'getNotificationCategoriesAsync');
  }

  return await NotificationCategoriesModule.getNotificationCategoriesAsync();
}
