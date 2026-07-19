//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Given a list of updates, implementations of this protocol should choose which of those updates to
 * automatically delete from disk and which ones to keep.
 */
@objc(EXUpdatesReaperSelectionPolicy)
public protocol ReaperSelectionPolicy {
  @objc func updatesToDelete(withLaunchedUpdate launchedUpdate: Update, updates: [Update], filters: [String: Any]?) -> [Update]
}
