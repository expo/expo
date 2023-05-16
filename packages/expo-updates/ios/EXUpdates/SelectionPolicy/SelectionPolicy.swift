//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Pluggable class whose essential responsibility is to determine an ordering of the updates stored
 * locally. Ordering updates is important in three separate cases, which map to the three methods
 * here.
 *
 * The default/basic implementations of these methods use an ordering based on `commitTime` (with
 * allowances for EAS Update branches). This has implications for rollbacks (rolled back updates
 * must have a new `id` and `commitTime` in order to take effect), amongst other things, and so this
 * class was designed to be pluggable in order to allow different implementations to be swapped in
 * with relative ease, in situations with different tradeoffs.
 *
 * The three methods are individually pluggable to allow for different behavior of specific parts of
 * the module in different situations. For example, in a development client, our policy for
 * retaining and deleting updates is different than in a release build, so we use a different
 * implementation of ReaperSelectionPolicy.
 *
 * Importantly (and non-trivially), expo-updates must be able to make all these determinations
 * without talking to any server. This is because the embedded update can change at any time,
 * without warning, and without the opportunity to talk to the updates server - when a new build is
 * installed via the App Store/TestFlight/sideloading - and this class must be able to decide which
 * update to launch in that case.
 */
@objc(EXUpdatesSelectionPolicy)
public final class SelectionPolicy: NSObject, LauncherSelectionPolicy, LoaderSelectionPolicy, ReaperSelectionPolicy {
  public let launcherSelectionPolicy: LauncherSelectionPolicy
  public let loaderSelectionPolicy: LoaderSelectionPolicy
  public let reaperSelectionPolicy: ReaperSelectionPolicy

  @objc public required init(
    launcherSelectionPolicy: LauncherSelectionPolicy,
    loaderSelectionPolicy: LoaderSelectionPolicy,
    reaperSelectionPolicy: ReaperSelectionPolicy
  ) {
    self.launcherSelectionPolicy = launcherSelectionPolicy
    self.loaderSelectionPolicy = loaderSelectionPolicy
    self.reaperSelectionPolicy = reaperSelectionPolicy
  }

  public func launchableUpdate(fromUpdates updates: [Update], filters: [String: Any]?) -> Update? {
    return launcherSelectionPolicy.launchableUpdate(fromUpdates: updates, filters: filters)
  }

  public func shouldLoadNewUpdate(_ newUpdate: Update?, withLaunchedUpdate launchedUpdate: Update?, filters: [String: Any]?) -> Bool {
    return loaderSelectionPolicy.shouldLoadNewUpdate(newUpdate, withLaunchedUpdate: launchedUpdate, filters: filters)
  }

  public func shouldLoadRollBackToEmbeddedDirective(_ directive: RollBackToEmbeddedUpdateDirective, withEmbeddedUpdate embeddedUpdate: Update, launchedUpdate: Update?, filters: [String: Any]?) -> Bool {
    return loaderSelectionPolicy.shouldLoadRollBackToEmbeddedDirective(directive, withEmbeddedUpdate: embeddedUpdate, launchedUpdate: launchedUpdate, filters: filters)
  }

  public func updatesToDelete(withLaunchedUpdate launchedUpdate: Update, updates: [Update], filters: [String: Any]?) -> [Update] {
    return reaperSelectionPolicy.updatesToDelete(withLaunchedUpdate: launchedUpdate, updates: updates, filters: filters)
  }
}
