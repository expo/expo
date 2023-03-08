//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * An EXUpdatesReaperSelectionPolicy which chooses which updates to delete taking into account manifest filters
 * originating from the server. If an older update is available, it will choose to keep one older
 * update in addition to the one currently running, preferring updates that match the same filters
 * if available.
 *
 * Uses `commitTime` to determine ordering of updates.
 *
 * Chooses only to delete updates who scope matches that of `launchedUpdate`.
 */
@objcMembers
public final class EXUpdatesReaperSelectionPolicyFilterAware: NSObject, EXUpdatesReaperSelectionPolicy {
  public func updatesToDelete(withLaunchedUpdate launchedUpdate: EXUpdatesUpdate, updates: [EXUpdatesUpdate], filters: [String: Any]?) -> [EXUpdatesUpdate] {
    var updatesToDelete: [EXUpdatesUpdate] = []

    // keep the launched update and one other, the next newest, to be safe and make rollbacks faster
    // keep the next newest update that matches all the manifest filters, unless no other updates do
    // in which case, keep the next newest across all updates
    var nextNewestUpdate: EXUpdatesUpdate?
    var nextNewestUpdateMatchingFilters: EXUpdatesUpdate?

    for update in updates {
      // ignore any updates whose scopeKey doesn't match that of the launched update
      if launchedUpdate.scopeKey != update.scopeKey {
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

        if EXUpdatesSelectionPolicies.doesUpdate(update, matchFilters: filters) {
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
