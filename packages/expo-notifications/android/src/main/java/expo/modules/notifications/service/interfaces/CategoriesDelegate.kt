package expo.modules.notifications.service.interfaces

import expo.modules.notifications.notifications.model.NotificationCategory

interface CategoriesDelegate {
  fun getCategories(): Collection<NotificationCategory>
  fun setCategory(category: NotificationCategory): NotificationCategory
  fun deleteCategory(identifier: String): Boolean
}
