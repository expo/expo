//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable type_name

import Foundation
import EXUpdates
import EXManifests

/**
 LauncherSelectionPolicy similar to LauncherSelectionPolicyFilterAware but specifically for
 Expo Go which uses a Expo-Go-specific field to determine compatibility.
 */
@objcMembers
public final class EXExpoGoLauncherSelectionPolicyFilterAware: NSObject, LauncherSelectionPolicy {
  let sdkVersions: [String]

  public init(sdkVersions: [String]) {
    self.sdkVersions = sdkVersions
  }

  public func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update? {
    var runnableUpdate: Update?
    for update in updates {
      guard let updateSDKVersion = update.manifest.expoGoSDKVersion() else {
        continue
      }

      if !sdkVersions.contains(updateSDKVersion) || !SelectionPolicies.doesUpdate(update, matchFilters: filters) {
        continue
      }

      guard let runnableUpdateInner = runnableUpdate else {
        runnableUpdate = update
        continue
      }

      if runnableUpdateInner.commitTime.compare(update.commitTime) == .orderedAscending {
        runnableUpdate = update
      }
    }
    return runnableUpdate
  }
}
