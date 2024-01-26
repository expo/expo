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
      ShortcutBadger.applyCountOrThrow(context.applicationContext, badgeCount)
      BadgeHelper.badgeCount = badgeCount
      true
    } catch (e: ShortcutBadgeException) {
      Log.d("expo-notifications", "Could not have set badge count: ${e.message}", e)
      e.printStackTrace()
      false
    }
  }
}
