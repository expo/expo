//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * A trivial EXUpdatesLauncherSelectionPolicy that will choose a single predetermined update to launch.
 */
@objcMembers
public final class EXUpdatesLauncherSelectionPolicySingleUpdate: NSObject, EXUpdatesLauncherSelectionPolicy {
  let updateId: UUID

  public required init(updateId: UUID) {
    self.updateId = updateId
  }

  public func launchableUpdate(fromUpdates updates: [EXUpdatesUpdate], filters: [String: Any]?) -> EXUpdatesUpdate? {
    return updates.first { update in
      return update.updateId == self.updateId
    }
  }
}
