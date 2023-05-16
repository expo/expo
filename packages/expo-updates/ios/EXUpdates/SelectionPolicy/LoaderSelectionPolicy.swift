//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Implementations of this protocol should be able to determine whether to load (either fetch remotely
 * or copy from an embedded location) a new update, given information about the one currently
 * running.
 */
@objc
public protocol LoaderSelectionPolicy {
  func shouldLoadNewUpdate(_ newUpdate: Update?, withLaunchedUpdate launchedUpdate: Update?, filters: [String: Any]?) -> Bool

  /**
   * Given a roll back to embedded directive, the embedded update before the directive is applied,
   * and the currently running update, decide whether the directive should be applied to the embedded
   * update and saved in the database (i.e. decide whether the combination of the directive's commitTime
   * and the embedded update is "newer" than the currently running update, according to this class's ordering).
   */
  func shouldLoadRollBackToEmbeddedDirective(_ directive: RollBackToEmbeddedUpdateDirective, withEmbeddedUpdate embeddedUpdate: Update, launchedUpdate: Update?, filters: [String: Any]?) -> Bool
}
