package versioned.host.exp.exponent.modules.universal.notifications

import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule
import expo.modules.notifications.notifications.categories.NotificationActionRecord
import expo.modules.notifications.notifications.model.NotificationCategory
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

  override fun serializeCategories(categories: Collection<NotificationCategory>): List<Bundle?> {
    return categories
      .filter { ScopedNotificationsIdUtils.checkIfCategoryBelongsToExperience(experienceKey, it) }
      .map(serializer::toBundle)
  }
}
