//  Copyright © 2019 650 Industries. All rights reserved.

/**
 * A ReaperSelectionPolicy which keeps a predefined maximum number of updates across all scopes,
 * and, once that number is surpassed, selects the updates least recently accessed (and then least
 * recently published) to delete. Ignores filters and scopes.
 *
 * Uses the `lastAccessed` property to determine ordering of updates.
 */
@objc(EXUpdatesReaperSelectionPolicyDevelopmentClient)
@objcMembers
public final class ReaperSelectionPolicyDevelopmentClient: NSObject, ReaperSelectionPolicy {
  private let maxUpdatesToKeep: Int

  public override init() {
    self.maxUpdatesToKeep = 10
  }

  public init(maxUpdatesToKeep: Int) {
    self.maxUpdatesToKeep = maxUpdatesToKeep

    if maxUpdatesToKeep <= 0 {
      NSException.init(
        name: .invalidArgumentException,
        reason: "Cannot initiailize ReaperSelectionPolicy with maxUpdatesToKeep <= 0"
      )
      .raise()
    }
  }
  public func updatesToDelete(withLaunchedUpdate launchedUpdate: Update, updates: [Update], filters: [String: Any]?) -> [Update] {
    if updates.count < maxUpdatesToKeep {
      return []
    }

    var updatesMutable = updates.sorted { update1, update2 in
      if update1.lastAccessed.compare(update2.lastAccessed) == .orderedSame {
        return update1.commitTime < update2.commitTime
      }
      return update1.lastAccessed < update2.lastAccessed
    }

    var updatesToDelete: [Update] = []
    var hasFoundLaunchedUpdate = false

    while updatesMutable.count > maxUpdatesToKeep {
      // swiftlint:disable:next force_unwrapping
      let oldest = updatesMutable.first!
      updatesMutable.remove(at: 0)

      if launchedUpdate.updateId == oldest.updateId {
        if hasFoundLaunchedUpdate {
          // avoid infinite loop
          NSException.init(
            name: .internalInconsistencyException,
            reason: "Multiple updates with the same ID were passed into ReaperSelectionPolicyDevelopmentClient"
          )
          .raise()
        }

        // we don't want to delete launchedUpdate, so put it back on the end of the stack
        updatesMutable.append(oldest)
        hasFoundLaunchedUpdate = true
      } else {
        updatesToDelete.append(oldest)
      }
    }

    return updatesToDelete
  }
}
