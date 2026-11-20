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
    val scopedCategories = categories.map {
      it.copy(identifier = ScopedNotificationsIdUtils.getScopedCategoryId(experienceKey, it.identifier))
    }
    super.setNotificationCategoriesAsync(scopedCategories, promise)
  }

  override fun ownsCategory(identifier: String): Boolean {
    return identifier.startsWith(ScopedNotificationsIdUtils.getScopedCategoryId(experienceKey, ""))
  }

  override fun serializeCategory(category: NotificationCategoryRecord): NotificationCategoryRecord {
    return category.copy(identifier = category.identifier.removePrefix(ScopedNotificationsIdUtils.getScopedCategoryId(experienceKey, "")))
  }
}
