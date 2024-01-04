//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Factory class to ease the construction of [SelectionPolicy] objects whose three methods all use
 * the same ordering policy.
 */
@objc(EXUpdatesSelectionPolicyFactory)
@objcMembers
public final class SelectionPolicyFactory: NSObject {
  public static func filterAwarePolicy(withRuntimeVersion runtimeVersion: String) -> SelectionPolicy {
    return SelectionPolicy.init(
      launcherSelectionPolicy: LauncherSelectionPolicyFilterAware.init(runtimeVersion: runtimeVersion),
      loaderSelectionPolicy: LoaderSelectionPolicyFilterAware(),
      reaperSelectionPolicy: ReaperSelectionPolicyFilterAware()
    )
  }
}
