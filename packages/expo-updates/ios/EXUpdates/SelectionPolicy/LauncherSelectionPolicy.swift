//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Given a list of updates, implementations of this protocol should be able to choose one to launch.
 */
@objc(EXUpdatesLauncherSelectionPolicy)
public protocol LauncherSelectionPolicy {
  @objc func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update?
}
