package expo.modules.notifications.service.delegates

import android.content.Context
import expo.modules.notifications.notifications.model.NotificationCategory
import expo.modules.notifications.service.interfaces.CategoriesDelegate

class ExpoCategoriesDelegate(protected val context: Context) : CategoriesDelegate {
  private val mStore = SharedPreferencesNotificationCategoriesStore(context)

  override fun getCategories(): Collection<NotificationCategory> {
    return mStore.allNotificationCategories
  }

  override fun setCategory(category: NotificationCategory): NotificationCategory? {
    return mStore.saveNotificationCategory(category)
  }

  override fun deleteCategory(identifier: String): Boolean {
    return mStore.removeNotificationCategory(identifier)
  }
}
