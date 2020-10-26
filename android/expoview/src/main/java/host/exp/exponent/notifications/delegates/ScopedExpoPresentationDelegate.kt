package host.exp.exponent.notifications.delegates

import android.content.Context
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior
import expo.modules.notifications.notifications.service.SharedPreferencesNotificationCategoriesStore
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate
import host.exp.exponent.notifications.ScopedCategoryAwareNotificationBuilder

class ScopedExpoPresentationDelegate(context: Context) : ExpoPresentationDelegate(context) {
  override fun createNotification(notification: Notification, notificationBehavior: NotificationBehavior?): android.app.Notification =
    ScopedCategoryAwareNotificationBuilder(context, SharedPreferencesNotificationCategoriesStore(context)).also {
      it.setNotification(notification)
      it.setAllowedBehavior(notificationBehavior)
    }.build()

}
