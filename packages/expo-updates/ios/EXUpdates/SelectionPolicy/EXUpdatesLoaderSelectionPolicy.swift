//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Implementations of this protocol should be able to determine whether to load (either fetch remotely
 * or copy from an embedded location) a new update, given information about the one currently
 * running.
 */
@objc
public protocol EXUpdatesLoaderSelectionPolicy {
  @objc func shouldLoadNewUpdate(_ newUpdate: EXUpdatesUpdate?, withLaunchedUpdate launchedUpdate: EXUpdatesUpdate?, filters: [String: Any]?) -> Bool
}
