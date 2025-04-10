//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

public class BadgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBadgeModule")

    AsyncFunction("getBadgeCountAsync") { () -> Int in
      return EXSharedApplication().applicationIconBadgeNumber
    }
    .runOnQueue(.main)

    AsyncFunction("setBadgeCountAsync") { (badgeCount: Int) -> Bool in
      let settings = await UNUserNotificationCenter.current().notificationSettings()

      if settings.badgeSetting == .enabled {
        Task { @MainActor in
          EXSharedApplication().applicationIconBadgeNumber = badgeCount
        }
        return true
      }
      return false
    }
  }
}
