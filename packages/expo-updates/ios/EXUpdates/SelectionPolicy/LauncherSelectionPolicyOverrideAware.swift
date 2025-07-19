// Copyright 2015-present 650 Industries. All rights reserved.

/**
 * A LauncherSelectionPolicy that prioritizes updates fetched with UpdatesConfigOverride.
 * This works similarly to LauncherSelectionPolicySingleUpdate but targets updates from override URLs
 * rather than a specific UUID.
 */
internal final class LauncherSelectionPolicyOverrideAware: LauncherSelectionPolicy {
  func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update? {
    let candidates = updates
      .filter { SelectionPolicies.doesUpdate($0, matchFilters: filters) }
      .sorted { $0.commitTime > $1.commitTime }

    let firstOverrideUpdate: Update? = candidates.first(where: { $0.isFromOverride })

    // If no override updates there, we just try first update anyway.
    return firstOverrideUpdate ?? candidates.first
  }
}
