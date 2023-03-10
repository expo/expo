//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

public typealias AppLauncherCompletionBlock = (_ error: Error?, _ success: Bool) -> Void

/**
 * Protocol through which an update can be launched from disk. Classes that implement this protocol
 * are responsible for selecting an eligible update to launch, ensuring all required assets are
 * present, and providing the fields here.
 */
@objc(EXUpdatesAppLauncher)
public protocol AppLauncher {
  @objc var launchedUpdate: Update? { get }
  @objc var launchAssetUrl: URL? { get }
  @objc var assetFilesMap: [String: Any]? { get }

  @objc func isUsingEmbeddedAssets() -> Bool
}
