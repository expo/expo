//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * A LauncherSelectionPolicy which chooses an update to launch based on the manifest
 * filters provided by the server. If multiple updates meet the criteria, the newest one (using
 * `commitTime` for ordering) is chosen, but the manifest filters are always taken into account
 * before the `commitTime`.
 */
@objc(EXUpdatesLauncherSelectionPolicyFilterAware)
@objcMembers
public final class LauncherSelectionPolicyFilterAware: NSObject, LauncherSelectionPolicy {
  let runtimeVersion: String

  public required init(runtimeVersion: String) {
    self.runtimeVersion = runtimeVersion
  }

  public func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update? {
    var runnableUpdate: Update?
    for update in updates {
      if runtimeVersion != update.runtimeVersion || !SelectionPolicies.doesUpdate(update, matchFilters: filters) {
        continue
      }

      guard let runnableUpdateInner = runnableUpdate else {
        runnableUpdate = update
        continue
      }

      if runnableUpdateInner.commitTime.compare(update.commitTime) == .orderedAscending {
        runnableUpdate = update
      }
    }
    return runnableUpdate
  }
}
