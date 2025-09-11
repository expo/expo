// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 * A policy like `LoaderSelectionPolicyFilterAware` for dev-client that allows nullable `UpdatesConfig`
 */
@objc(EXUpdatesLoaderSelectionPolicyDevelopmentClient)
@objcMembers
public final class LoaderSelectionPolicyDevelopmentClient: NSObject, LoaderSelectionPolicy {
  private let config: UpdatesConfig?

  public required init(config: UpdatesConfig?) {
    self.config = config
  }

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

    // if new update doesn't match the configured URL, don't load it
    if newUpdate.url != nil && newUpdate.url != config?.updateUrl {
      return false
    }

    // if new update doesn't match the configured request headers, don't load it
    if newUpdate.requestHeaders != nil && newUpdate.requestHeaders != config?.requestHeaders {
      return false
    }

    // if the launched update no longer matches the configured URL, we should load the new update
    if launchedUpdate.url != nil && launchedUpdate.url != config?.updateUrl {
      return true
    }

    // if the launched update no longer matches the configured request headers, we should load the new update
    if launchedUpdate.requestHeaders != nil && launchedUpdate.requestHeaders != config?.requestHeaders {
      return true
    }

    return launchedUpdate.commitTime.compare(newUpdate.commitTime) == .orderedAscending
  }

  public func shouldLoadRollBackToEmbeddedDirective(
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

    return launchedUpdate.commitTime.compare(directive.commitTime) == .orderedAscending
  }
}
