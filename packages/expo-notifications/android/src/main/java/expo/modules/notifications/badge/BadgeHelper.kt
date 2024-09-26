package expo.modules.notifications.badge

import android.content.Context
import android.util.Log
import me.leolin.shortcutbadger.ShortcutBadgeException
import me.leolin.shortcutbadger.ShortcutBadger

object BadgeHelper {
  var badgeCount = 0
    get() = synchronized(this) { field }
    private set(value) = synchronized(this) { field = value }

  fun setBadgeCount(context: Context, badgeCount: Int): Boolean {
    return try {
      if (badgeCount == 0) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.cancelAll()
      } else {
        ShortcutBadger.applyCountOrThrow(context.applicationContext, badgeCount)
      }
      BadgeHelper.badgeCount = badgeCount
      true
    } catch (e: ShortcutBadgeException) {
      Log.d("expo-notifications", "Could not have set badge count: ${e.message}", e)
      e.printStackTrace()
      false
    }
  }
}
