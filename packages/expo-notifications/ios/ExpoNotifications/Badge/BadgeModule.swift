//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

public class BadgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBadgeModule")

    AsyncFunction("getBadgeCountAsync") { () -> Int in
      return RCTSharedApplication()?.applicationIconBadgeNumber ?? 0
    }
    .runOnQueue(.main)

    AsyncFunction("setBadgeCountAsync") { (badgeCount: Int) -> Bool in
      let center = UNUserNotificationCenter.current()

      let settings = await center.notificationSettings()

      if settings.badgeSetting == .enabled {
        try await center.setBadgeCount(badgeCount)
        return true
      }
      return false
    }
  }
}
