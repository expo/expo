/**
 * Deletes the category associated with the provided identifier.
 * @param identifier Identifier initially provided to `setNotificationCategoryAsync` when creating the category.
 * @return A Promise which resolves to `true` if the category was successfully deleted, or `false` if it was not.
 * An example of when this method would return `false` is if you try to delete a category that doesn't exist.
 * @platform android
 * @platform ios
 * @header categories
 */
export default function deleteNotificationCategoryAsync(identifier: string): Promise<boolean>;
//# sourceMappingURL=deleteNotificationCategoryAsync.d.ts.map