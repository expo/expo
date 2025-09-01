package versioned.host.exp.exponent.modules.universal.notifications

import expo.modules.kotlin.Promise
import expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule
import expo.modules.notifications.notifications.categories.NotificationActionRecord
import expo.modules.notifications.notifications.categories.NotificationCategoryRecord
import host.exp.exponent.kernel.ExperienceKey
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils

class ScopedExpoNotificationCategoriesModule(
  private val experienceKey: ExperienceKey
) : ExpoNotificationCategoriesModule() {
  override fun setNotificationCategoryAsync(
    identifier: String,
    actionArguments: List<NotificationActionRecord>,
    categoryOptions: Map<String, Any?>?,
    promise: Promise
  ) {
    val scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(experienceKey, identifier)
    super.setNotificationCategoryAsync(
      scopedCategoryIdentifier,
      actionArguments,
      categoryOptions,
      promise
    )
  }

  override fun deleteNotificationCategoryAsync(identifier: String, promise: Promise) {
    val scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(experienceKey, identifier)
    super.deleteNotificationCategoryAsync(scopedCategoryIdentifier, promise)
  }

  override fun setNotificationCategoriesAsync(categories: List<NotificationCategoryRecord>, promise: Promise) {
    promise.reject("ERR_UNAVAILABLE", "Replacing all notification categories is not supported in Expo Go because categories are shared between projects. Use a development build or setNotificationCategoryAsync instead.", null)
  }

  override fun filterCategories(categories: Collection<NotificationCategoryRecord>): Collection<NotificationCategoryRecord> {
    val prefix = ScopedNotificationsIdUtils.getScopedCategoryId(experienceKey, "")
    return categories.filter { it.identifier.startsWith(prefix) }
  }
}
