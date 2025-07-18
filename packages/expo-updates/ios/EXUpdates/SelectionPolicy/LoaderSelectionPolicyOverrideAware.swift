// Copyright 2015-present 650 Industries. All rights reserved.

/**
 * A LoaderSelectionPolicy that forces loading of updates when UpdatesConfigOverride is active.
 * This enables one-time updates from different URLs/headers set via `setUpdateURLAndRequestHeadersOverride`.
 * The policy always loads new updates regardless of commitTime.
 */
internal final class LoaderSelectionPolicyOverrideAware: LoaderSelectionPolicy {
  func shouldLoadNewUpdate(_ newUpdate: Update?, withLaunchedUpdate launchedUpdate: Update?, filters: [String: Any]?) -> Bool {
    guard let newUpdate = newUpdate,
      SelectionPolicies.doesUpdate(newUpdate, matchFilters: filters) else {
      return false
    }
    guard let launchedUpdate = launchedUpdate else {
      return true
    }
    return newUpdate.updateId != launchedUpdate.updateId
  }

  func shouldLoadRollBackToEmbeddedDirective(
    _ directive: RollBackToEmbeddedUpdateDirective,
    withEmbeddedUpdate embeddedUpdate: Update,
    launchedUpdate: Update?,
    filters: [String: Any]?
  ) -> Bool {
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

    return launchedUpdate.updateId == embeddedUpdate.updateId
  }
}
