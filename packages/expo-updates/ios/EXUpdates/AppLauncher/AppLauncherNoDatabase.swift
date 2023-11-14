//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping

import Foundation

/**
 * Implementation of AppLauncher which always uses the update embedded in the application
 * package, avoiding SQLite and the expo-updates file store entirely.
 *
 * This is only used in rare cases when the database/file system is corrupt or otherwise
 * inaccessible, but we still want to avoid crashing. The exported property `isEmergencyLaunch` on
 * UpdatesModule should be `true` whenever this class is used.
 */
@objc(EXUpdatesAppLauncherNoDatabase)
@objcMembers
public final class AppLauncherNoDatabase: NSObject, AppLauncher {
  public var launchedUpdate: Update?
  public var launchAssetUrl: URL?
  public var assetFilesMap: [String: String]?

  public override init() {}

  public func launchUpdate() {
    precondition(assetFilesMap == nil, "assetFilesMap should be null for embedded updates")
    launchAssetUrl = Bundle.main.url(
      forResource: EmbeddedAppLoader.EXUpdatesBareEmbeddedBundleFilename,
      withExtension: EmbeddedAppLoader.EXUpdatesBareEmbeddedBundleFileType
    )
  }

  public func isUsingEmbeddedAssets() -> Bool {
    return assetFilesMap == nil
  }
}
