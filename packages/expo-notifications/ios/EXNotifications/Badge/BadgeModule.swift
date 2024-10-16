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

    AsyncFunction("setBadgeCountAsync") { (badgeCount: Int) -> Bool in
      var result = false
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        if settings.badgeSetting == .enabled {
          EXSharedApplication().applicationIconBadgeNumber = badgeCount
          result = true
        }
      }
      return result
    }
  }
}
