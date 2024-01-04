package host.exp.exponent.notifications

import android.content.Context
import androidx.core.app.NotificationCompat
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import host.exp.exponent.notifications.model.ScopedNotificationRequest
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils

class ScopedCategoryAwareNotificationBuilder(
  context: Context,
  store: SharedPreferencesNotificationCategoriesStore
) : ScopedExpoNotificationBuilder(context, store) {

  override fun addActionsToBuilder(
    builder: NotificationCompat.Builder,
    categoryIdentifier: String
  ) {
    val requester = notification.notificationRequest
    val content = notificationContent
    val scopedCategoryIdentifier: String = if (requester is ScopedNotificationRequest) {
      ScopedNotificationsIdUtils.getScopedCategoryIdRaw(
        requester.experienceScopeKeyString!!,
        content.categoryId
      )
    } else {
      content.categoryId
    }
    super.addActionsToBuilder(builder, scopedCategoryIdentifier)
  }
}
