//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Given a list of updates, implementations of this protocol should choose which of those updates to
 * automatically delete from disk and which ones to keep.
 */
@objc
public protocol EXUpdatesReaperSelectionPolicy {
  @objc func updatesToDelete(withLaunchedUpdate launchedUpdate: EXUpdatesUpdate, updates: [EXUpdatesUpdate], filters: [String: Any]?) -> [EXUpdatesUpdate]
}
