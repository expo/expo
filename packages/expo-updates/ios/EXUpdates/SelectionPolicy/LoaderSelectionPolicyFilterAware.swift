//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * A LoaderSelectionPolicy which decides whether or not to load an update or directive, taking filters into
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

  public func shouldLoadRollBackToEmbeddedDirective(_ directive: RollBackToEmbeddedUpdateDirective, withEmbeddedUpdate embeddedUpdate: Update, launchedUpdate: Update?, filters: [String : Any]?) -> Bool {
    // if the embedded update doesn't match the filters, don't roll back to it (changing the
    // timestamp of it won't change filter validity)
    guard SelectionPolicies.doesUpdate(embeddedUpdate, matchFilters: filters) else {
      return false
    }

    guard let launchedUpdate = launchedUpdate else {
      return true
    }

    // if the current update doesn't pass the manifest filters
        // we should roll back to the embedded update no matter the commitTime
    if !SelectionPolicies.doesUpdate(launchedUpdate, matchFilters: filters) {
      return true
    }

    return launchedUpdate.commitTime.compare(directive.commitTime) == .orderedAscending
  }
}
