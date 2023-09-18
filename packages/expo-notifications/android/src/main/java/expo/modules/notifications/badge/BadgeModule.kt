package expo.modules.notifications.badge

import android.content.Context
import expo.modules.core.ExportedModule
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod

class BadgeModule(context: Context) : ExportedModule(context) {
  override fun getName(): String = "ExpoBadgeModule"

  @ExpoMethod
  fun getBadgeCountAsync(promise: Promise) {
    promise.resolve(BadgeHelper.badgeCount)
  }

  @ExpoMethod
  fun setBadgeCountAsync(badgeCount: Int, promise: Promise) {
    promise.resolve(BadgeHelper.setBadgeCount(context, badgeCount))
  }
}
