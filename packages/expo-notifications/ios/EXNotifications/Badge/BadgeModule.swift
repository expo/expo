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

    AsyncFunction("setBadgeCountAsync") { (badgeCount: Int, promise: Promise) in
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        let canSetBadge = settings.badgeSetting == .enabled
        if canSetBadge {
          EXSharedApplication().applicationIconBadgeNumber = badgeCount
        }
        promise.resolve(canSetBadge)
      }
    }
  }
}
