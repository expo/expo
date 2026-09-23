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
  private let embeddedUpdateId: UUID?

  public override init() {
    self.maxUpdatesToKeep = 2
    self.embeddedUpdateId = nil
  }

  public convenience init(maxUpdatesToKeep: Int) {
    self.init(maxUpdatesToKeep: maxUpdatesToKeep, embeddedUpdateId: nil)
  }

  public init(maxUpdatesToKeep: Int, embeddedUpdateId: UUID?) {
    self.maxUpdatesToKeep = maxUpdatesToKeep
    self.embeddedUpdateId = embeddedUpdateId

    if maxUpdatesToKeep < 2 {
      NSException.init(
        name: .invalidArgumentException,
        reason: "Cannot initialize ReaperSelectionPolicyFilterAware with maxUpdatesToKeep < 2"
      )
      .raise()
    }
  }

  public func updatesToDelete(withLaunchedUpdate launchedUpdate: Update, updates: [Update], filters: [String: Any]?) -> [Update] {
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
        olderUpdates.append(update)
      }
    }

    // Embedded rows from previous binaries cannot be launched and must not occupy fallback slots.
    let launchableOlderUpdates = olderUpdates.filter {
      $0.status != .StatusEmbedded || $0.updateId == embeddedUpdateId
    }
    let maxOlderUpdatesToKeep = maxUpdatesToKeep - 1
    let matchingUpdatesToKeep = launchableOlderUpdates
      .filter { SelectionPolicies.doesUpdate($0, matchFilters: filters) }
      .sorted { $0.commitTime.compare($1.commitTime) == .orderedDescending }
      .prefix(maxOlderUpdatesToKeep)
    var olderUpdatesToKeep = Set(matchingUpdatesToKeep)

    if matchingUpdatesToKeep.count < maxOlderUpdatesToKeep {
      let remainingUpdatesToKeep = launchableOlderUpdates
        .filter { !olderUpdatesToKeep.contains($0) }
        .sorted { $0.commitTime.compare($1.commitTime) == .orderedDescending }
        .prefix(maxOlderUpdatesToKeep - matchingUpdatesToKeep.count)
      olderUpdatesToKeep.formUnion(remainingUpdatesToKeep)
    }

    return olderUpdates.filter { !olderUpdatesToKeep.contains($0) && $0.updateId != embeddedUpdateId }
  }
}

// swiftlint:enable identifier_name
