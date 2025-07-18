// Copyright 2015-present 650 Industries. All rights reserved.

// swiftlint:disable lower_acl_than_parent

/**
 * A ReaperSelectionPolicy based on `ReaperSelectionPolicyFilterAware` that only remove override updates.
 */
internal final class ReaperSelectionPolicyOverrideAware: ReaperSelectionPolicyFilterAware {
  public override func updatesToDelete(withLaunchedUpdate launchedUpdate: Update, updates: [Update], filters: [String: Any]?) -> [Update] {
    let overrideUpdates: [Update] = updates.filter { $0.isFromOverride }
    return super.updatesToDelete(withLaunchedUpdate: launchedUpdate, updates: overrideUpdates, filters: filters)
  }
}

// swiftlint:enable lower_acl_than_parent
