//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Implementations of this protocol should be able to determine whether to load (either fetch remotely
 * or copy from an embedded location) a new update, given information about the one currently
 * running.
 */
@objc(EXUpdatesLoaderSelectionPolicy)
public protocol LoaderSelectionPolicy {
  @objc func shouldLoadNewUpdate(_ newUpdate: Update?, withLaunchedUpdate launchedUpdate: Update?, filters: [String: Any]?) -> Bool
}
