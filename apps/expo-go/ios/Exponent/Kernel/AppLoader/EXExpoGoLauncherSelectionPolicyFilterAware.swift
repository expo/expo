//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable type_name

import Foundation
import EXUpdates
import EXManifests

/**
 LauncherSelectionPolicy similar to LauncherSelectionPolicyFilterAware but specifically for
 Expo Go which uses a Expo-Go-specific field to determine compatibility.

 Compatibility is determined by SDK major version (see `Versions.areCompatible`) so that a client
 patch release whose version differs in its patch from the supported SDK version (e.g. a 56.0.1
 client serving SDK 56.0.0 updates) can still launch matching updates.
 */
@objcMembers
public final class EXExpoGoLauncherSelectionPolicyFilterAware: NSObject, LauncherSelectionPolicy {
  let supportedSdkVersion: String

  public init(supportedSdkVersion: String) {
    self.supportedSdkVersion = supportedSdkVersion
  }

  public func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update? {
    var runnableUpdate: Update?
    for update in updates {
      guard let updateSDKVersion = update.manifest.expoGoSDKVersion() else {
        continue
      }

      if !Versions.areCompatible(supportedSdkVersion: supportedSdkVersion, sdkVersion: updateSDKVersion) ||
          !SelectionPolicies.doesUpdate(update, matchFilters: filters) {
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
