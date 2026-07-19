package expo.modules.notifications.badge

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BadgeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoBadgeModule")

    AsyncFunction<Int>("getBadgeCountAsync") {
      BadgeHelper.badgeCount
    }

    AsyncFunction("setBadgeCountAsync") { badgeCount: Int ->
      BadgeHelper.setBadgeCount(
        appContext.reactContext ?: throw Exceptions.ReactContextLost(),
        badgeCount
      )
    }
  }
}
