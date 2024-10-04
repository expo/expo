//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * An EXUpdatesLoaderSelectionPolicy which decides whether or not to load an update, taking filters into
 * account. Returns true (should load the update) if we don't have an existing newer update that
 * matches the given manifest filters.
 *
 * Uses `commitTime` to determine ordering of updates.
 */
@objc(EXUpdatesLoaderSelectionPolicyFilterAware)
@objcMembers
public final class LoaderSelectionPolicyFilterAware: NSObject, LoaderSelectionPolicy {
  public func shouldLoadNewUpdate(_ newUpdate: Update?, withLaunchedUpdate launchedUpdate: Update?, filters: [String: Any]?) -> Bool {
    guard let newUpdate = newUpdate,
      SelectionPolicies.doesUpdate(newUpdate, matchFilters: filters) else {
      return false
    }

    guard let launchedUpdate = launchedUpdate else {
      return true
    }

    // if the current update doesn't pass the manifest filters
    // we should load the new update no matter the commitTime
    if !SelectionPolicies.doesUpdate(launchedUpdate, matchFilters: filters) {
      return true
    }

    return launchedUpdate.commitTime.compare(newUpdate.commitTime) == .orderedAscending
  }
}
