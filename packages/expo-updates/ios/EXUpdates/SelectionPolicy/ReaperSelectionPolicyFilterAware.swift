//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * A ReaperSelectionPolicy which chooses which updates to delete taking into account manifest filters
 * originating from the server. If an older update is available, it will choose to keep one older
 * update in addition to the one currently running, preferring updates that match the same filters
 * if available.
 *
 * Uses `commitTime` to determine ordering of updates.
 *
 * Chooses only to delete updates who scope matches that of `launchedUpdate`.
 */
@objc(EXUpdatesReaperSelectionPolicyFilterAware)
@objcMembers
public final class ReaperSelectionPolicyFilterAware: NSObject, ReaperSelectionPolicy {
  public func updatesToDelete(withLaunchedUpdate launchedUpdate: Update, updates: [Update], filters: [String: Any]?) -> [Update] {
    var updatesToDelete: [Update] = []

    // keep the launched update and one other, the next newest, to be safe and make rollbacks faster
    // keep the next newest update that matches all the manifest filters, unless no other updates do
    // in which case, keep the next newest across all updates
    var nextNewestUpdate: Update?
    var nextNewestUpdateMatchingFilters: Update?

    for update in updates {
      guard let launchedUpdateScopeKey = launchedUpdate.scopeKey,
        let updateScopeKey = update.scopeKey else {
        continue
      }

      // ignore any updates whose scopeKey doesn't match that of the launched update
      if launchedUpdateScopeKey != updateScopeKey {
        continue
      }

      if launchedUpdate.commitTime.compare(update.commitTime) == .orderedDescending {
        updatesToDelete.append(update)

        if let nextNewestUpdateInner = nextNewestUpdate,
          update.commitTime.compare(nextNewestUpdateInner.commitTime) == .orderedDescending {
          nextNewestUpdate = update
        } else {
          nextNewestUpdate = update
        }

        if SelectionPolicies.doesUpdate(update, matchFilters: filters) {
          if let nextNewestUpdateMatchingFiltersInner = nextNewestUpdateMatchingFilters,
             update.commitTime.compare(nextNewestUpdateMatchingFiltersInner.commitTime) == .orderedDescending {
            nextNewestUpdateMatchingFilters = update
          } else {
            nextNewestUpdateMatchingFilters = update
          }
        }
      }
    }

    if let nextNewestUpdateMatchingFilters = nextNewestUpdateMatchingFilters {
      updatesToDelete.remove(nextNewestUpdateMatchingFilters)
    } else if let nextNewestUpdate = nextNewestUpdate {
      updatesToDelete.remove(nextNewestUpdate)
    }
    return updatesToDelete
  }
}
