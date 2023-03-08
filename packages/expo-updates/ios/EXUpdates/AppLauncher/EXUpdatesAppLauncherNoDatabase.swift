//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping

import Foundation

/**
 * Implementation of EXUpdatesAppLauncher which always uses the update embedded in the application
 * package, avoiding SQLite and the expo-updates file store entirely.
 *
 * This is only used in rare cases when the database/file system is corrupt or otherwise
 * inaccessible, but we still want to avoid crashing. The exported property `isEmergencyLaunch` on
 * EXUpdatesModule should be `true` whenever this class is used.
 */
@objcMembers
public final class EXUpdatesAppLauncherNoDatabase: NSObject, EXUpdatesAppLauncher {
  public var launchedUpdate: EXUpdatesUpdate?
  public var launchAssetUrl: URL?
  public var assetFilesMap: [String: Any]?

  public override init() {}

  public func launchUpdate(withConfig config: EXUpdatesConfig) {
    launchedUpdate = EXUpdatesEmbeddedAppLoader.embeddedManifest(withConfig: config, database: nil)
    if let launchedUpdate = launchedUpdate {
      if launchedUpdate.status == EXUpdatesUpdateStatus.StatusEmbedded {
        precondition(assetFilesMap == nil, "assetFilesMap should be null for embedded updates")
        launchAssetUrl = Bundle.main.url(
          forResource: EXUpdatesEmbeddedAppLoader.EXUpdatesBareEmbeddedBundleFilename,
          withExtension: EXUpdatesEmbeddedAppLoader.EXUpdatesBareEmbeddedBundleFileType
        )
      } else {
        launchAssetUrl = Bundle.main.url(
          forResource: EXUpdatesEmbeddedAppLoader.EXUpdatesEmbeddedBundleFilename,
          withExtension: EXUpdatesEmbeddedAppLoader.EXUpdatesEmbeddedBundleFileType
        )

        var assetFilesMapLocal: [String: String] = [:]
        for asset in launchedUpdate.assets()! {
          if let assetKey = asset.key, let localUrl = EXUpdatesUtils.url(forBundledAsset: asset) {
            assetFilesMapLocal[assetKey] = localUrl.absoluteString
          }
        }
        assetFilesMap = assetFilesMapLocal
      }
    }
  }

  public func isUsingEmbeddedAssets() -> Bool {
    return assetFilesMap == nil
  }
}
