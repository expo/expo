package host.exp.exponent.notifications

import android.content.Context
import android.util.Log
import androidx.core.app.NotificationCompat
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import host.exp.exponent.notifications.model.ScopedNotificationRequest
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils

class ScopedCategoryAwareNotificationBuilder(
  context: Context,
  notification: Notification,
  store: SharedPreferencesNotificationCategoriesStore
) : ScopedExpoNotificationBuilder(context, notification, store) {

  override fun addActionsToBuilder(
    builder: NotificationCompat.Builder,
    categoryIdentifier: String
  ) {
    val requester = notification.notificationRequest
    val content = notificationContent
    val categoryId = content.categoryId ?: run {
      Log.e("expo-notifications", "Notification content is missing categoryId")
      return@addActionsToBuilder
    }
    val scopedCategoryIdentifier: String = if (requester is ScopedNotificationRequest) {
      ScopedNotificationsIdUtils.getScopedCategoryIdRaw(
        requester.experienceScopeKeyString!!,
        categoryId
      )
    } else {
      categoryId
    }
    super.addActionsToBuilder(builder, scopedCategoryIdentifier)
  }
}
