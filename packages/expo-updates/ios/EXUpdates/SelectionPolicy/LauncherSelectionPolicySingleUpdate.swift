//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * A trivial LauncherSelectionPolicy that will choose a single predetermined update to launch.
 */
@objc(EXUpdatesLauncherSelectionPolicySingleUpdate)
@objcMembers
public final class LauncherSelectionPolicySingleUpdate: NSObject, LauncherSelectionPolicy {
  let updateId: UUID

  public required init(updateId: UUID) {
    self.updateId = updateId
  }

  public func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update? {
    return updates.first { update in
      return update.updateId == self.updateId
    }
  }
}
