package expo.modules.notifications.badge

import android.content.Context
import android.util.Log
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import me.leolin.shortcutbadger.ShortcutBadgeException
import me.leolin.shortcutbadger.ShortcutBadger

class BadgeModule(context: Context) : ExportedModule(context) {
  override fun getName(): String = "ExpoBadgeModule"

  @ExpoMethod
  fun getBadgeCountAsync(promise: Promise) {
    promise.resolve(badgeCount)
  }

  @ExpoMethod
  fun setBadgeCountAsync(badgeCount: Int, promise: Promise) {
    try {
      ShortcutBadger.applyCountOrThrow(context.applicationContext, badgeCount)
      BadgeModule.badgeCount = badgeCount
      promise.resolve(true)
    } catch (e: ShortcutBadgeException) {
      Log.d("expo-notifications", "Could not have set badge count: ${e.message}", e)
      e.printStackTrace()
      promise.resolve(false)
    }
  }

  companion object {
    var badgeCount = 0
      get() = synchronized(this) { field }
      set(value) = synchronized(this) { field = value }
  }
}
