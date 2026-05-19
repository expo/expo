//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable identifier_name

/**
 * A ReaperSelectionPolicy which chooses which updates to delete taking into account manifest filters
 * originating from the server. If older updates are available, it will choose to keep up to
 * `maxUpdatesToKeep - 1` older updates in addition to the one currently running, preferring
 * updates that match the same filters if available.
 *
 * Uses `commitTime` to determine ordering of updates.
 *
 * Chooses only to delete updates whose scope matches that of `launchedUpdate`.
 */
@objc(EXUpdatesReaperSelectionPolicyFilterAware)
@objcMembers
public final class ReaperSelectionPolicyFilterAware: NSObject, ReaperSelectionPolicy {
  private let maxUpdatesToKeep: Int

  public override init() {
    self.maxUpdatesToKeep = 2
  }

  public init(maxUpdatesToKeep: Int) {
    self.maxUpdatesToKeep = maxUpdatesToKeep

    if maxUpdatesToKeep < 2 {
      NSException.init(
        name: .invalidArgumentException,
        reason: "Cannot initialize ReaperSelectionPolicyFilterAware with maxUpdatesToKeep < 2"
      )
      .raise()
    }
  }

  public func updatesToDelete(withLaunchedUpdate launchedUpdate: Update, updates: [Update], filters: [String: Any]?) -> [Update] {
    var updatesToDelete: [Update] = []
    var olderUpdates: [Update] = []

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
        olderUpdates.append(update)
      }
    }

    let maxOlderUpdatesToKeep = maxUpdatesToKeep - 1
    var olderUpdatesToKeep = olderUpdates
      .filter { SelectionPolicies.doesUpdate($0, matchFilters: filters) }
      .sorted { $0.commitTime.compare($1.commitTime) == .orderedDescending }
      .prefix(maxOlderUpdatesToKeep)
      .map { $0 }

    if olderUpdatesToKeep.count < maxOlderUpdatesToKeep {
      olderUpdatesToKeep.append(contentsOf: olderUpdates
        .filter { !olderUpdatesToKeep.contains($0) }
        .sorted { $0.commitTime.compare($1.commitTime) == .orderedDescending }
        .prefix(maxOlderUpdatesToKeep - olderUpdatesToKeep.count))
    }

    updatesToDelete.removeAll { olderUpdatesToKeep.contains($0) }
    return updatesToDelete.filter { $0.status != .StatusEmbedded }
  }
}

// swiftlint:enable identifier_name
