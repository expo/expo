//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Factory class to ease the construction of [SelectionPolicy] objects whose three methods all use
 * the same ordering policy.
 */
@objcMembers
public final class EXUpdatesSelectionPolicyFactory: NSObject {
  public static func filterAwarePolicy(withRuntimeVersion runtimeVersion: String) -> EXUpdatesSelectionPolicy {
    return EXUpdatesSelectionPolicy.init(
      launcherSelectionPolicy: EXUpdatesLauncherSelectionPolicyFilterAware.init(runtimeVersion: runtimeVersion),
      loaderSelectionPolicy: EXUpdatesLoaderSelectionPolicyFilterAware(),
      reaperSelectionPolicy: EXUpdatesReaperSelectionPolicyFilterAware()
    )
  }

  public static func filterAwarePolicy(withRuntimeVersions runtimeVersions: [String]) -> EXUpdatesSelectionPolicy {
    return EXUpdatesSelectionPolicy.init(
      launcherSelectionPolicy: EXUpdatesLauncherSelectionPolicyFilterAware.init(runtimeVersions: runtimeVersions),
      loaderSelectionPolicy: EXUpdatesLoaderSelectionPolicyFilterAware(),
      reaperSelectionPolicy: EXUpdatesReaperSelectionPolicyFilterAware()
    )
  }
}
