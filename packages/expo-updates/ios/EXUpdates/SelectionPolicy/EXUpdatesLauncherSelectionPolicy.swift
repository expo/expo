//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Given a list of updates, implementations of this protocol should be able to choose one to launch.
 */
@objc
public protocol EXUpdatesLauncherSelectionPolicy {
  @objc func launchableUpdate(fromUpdates updates: [EXUpdatesUpdate], filters: [String: Any]?) -> EXUpdatesUpdate?
}
