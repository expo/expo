package expo.modules.notifications.badge

import android.content.Context

object BadgeHelper {
  val badgeCount = 0

  fun setBadgeCount(context: Context, badgeCount: Int): Boolean {
    if (badgeCount != 0) {
      return false
    }

    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
    notificationManager.cancelAll()
    return true
  }
}
