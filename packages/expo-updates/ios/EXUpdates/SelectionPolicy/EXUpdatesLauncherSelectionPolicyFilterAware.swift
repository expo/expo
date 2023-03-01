//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * An EXUpdatesLauncherSelectionPolicy which chooses an update to launch based on the manifest
 * filters provided by the server. If multiple updates meet the criteria, the newest one (using
 * `commitTime` for ordering) is chosen, but the manifest filters are always taken into account
 * before the `commitTime`.
 */
@objcMembers
public final class EXUpdatesLauncherSelectionPolicyFilterAware: NSObject, EXUpdatesLauncherSelectionPolicy {
  let runtimeVersions: [String]

  public convenience init(runtimeVersion: String) {
    self.init(runtimeVersions: [runtimeVersion])
  }

  public init(runtimeVersions: [String]) {
    self.runtimeVersions = runtimeVersions
  }

  public func launchableUpdate(fromUpdates updates: [EXUpdatesUpdate], filters: [String: Any]?) -> EXUpdatesUpdate? {
    var runnableUpdate: EXUpdatesUpdate?
    for update in updates {
      if !runtimeVersions.contains(update.runtimeVersion) || !EXUpdatesSelectionPolicies.doesUpdate(update, matchFilters: filters) {
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
