package abi48_0_0.expo.modules.notifications.service.interfaces

import expo.modules.notifications.notifications.model.NotificationCategory
import abi48_0_0.expo.modules.notifications.service.NotificationsService

/**
 * A delegate to [NotificationsService] responsible for handling events
 * related to [NotificationCategory]s.
 */
interface CategoriesDelegate {
  fun getCategories(): Collection<NotificationCategory>
  fun setCategory(category: NotificationCategory): NotificationCategory?
  fun deleteCategory(identifier: String): Boolean
}
