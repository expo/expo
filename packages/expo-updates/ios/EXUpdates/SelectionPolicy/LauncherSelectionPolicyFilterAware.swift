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
  private let config: UpdatesConfig?

  public required init(runtimeVersion: String, config: UpdatesConfig?) {
    self.runtimeVersion = runtimeVersion
    self.config = config
  }

  public func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update? {
    var candidates = updates
      .filter { runtimeVersion == $0.runtimeVersion && SelectionPolicies.doesUpdate($0, matchFilters: filters) }

    let hasUpdatesOverride = self.config?.hasUpdatesOverride ?? false
    if hasUpdatesOverride {
      candidates = candidates
        .filter { $0.url == self.config?.updateUrl && $0.requestHeaders == self.config?.requestHeaders }
    }

    return candidates.sorted { $0.commitTime > $1.commitTime }.first
  }
}
