// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 * A policy like `LoaderSelectionPolicyFilterAware` for dev-client that allows nullable `UpdatesConfig`
 */
@objc(EXUpdatesLauncherSelectionPolicyDevelopmentClient)
@objcMembers
public final class LauncherSelectionPolicyDevelopmentClient: NSObject, LauncherSelectionPolicy {
  let runtimeVersion: String
  private let config: UpdatesConfig?

  public required init(runtimeVersion: String, config: UpdatesConfig?) {
    self.runtimeVersion = runtimeVersion
    self.config = config
  }

  public func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update? {
    return updates
      .filter { runtimeVersion == $0.runtimeVersion && SelectionPolicies.doesUpdate($0, matchFilters: filters) }
      .filter { ($0.url == nil && $0.requestHeaders == nil) || ($0.url == config?.updateUrl && $0.requestHeaders == config?.requestHeaders) }
      .sorted { $0.commitTime > $1.commitTime }.first
  }
}
