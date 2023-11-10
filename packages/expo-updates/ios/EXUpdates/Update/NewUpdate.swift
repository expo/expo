//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation
import EXManifests

public final class NewUpdate: Update {
  /**
   * Method for initializing updates with modern format manifests that conform to the Expo Updates
   * specification (https://docs.expo.dev/technical-specs/expo-updates-1/). This is used by EAS
   * Update.
   */
  public static func update(
    withNewManifest: NewManifest,
    extensions: [String: Any],
    config: UpdatesConfig,
    database: UpdatesDatabase
  ) -> Update {
    let manifest = withNewManifest
    let assetHeaders: [String: Any] = extensions.optionalValue(forKey: "assetRequestHeaders") ?? [:]

    let updateId = manifest.rawId()
    let commitTime = manifest.createdAt()
    let runtimeVersion = manifest.runtimeVersion()
    let launchAsset = manifest.launchAsset()
    let assets = manifest.assets()

    let uuid = UUID(uuidString: updateId).require("update ID should be a valid UUID")

    let bundleUrlString: String = launchAsset.requiredValue(forKey: "url")
    let bundleUrl = URL(string: bundleUrlString).require("launchAsset.url should be a valid URL")

    var processedAssets: [UpdateAsset] = []

    let bundleKey: String? = launchAsset.optionalValue(forKey: "key")
    // TODO-JJ save launch assets with no file extension to match android
    let jsBundleAsset = UpdateAsset(key: bundleKey, type: EmbeddedAppLoader.EXUpdatesEmbeddedBundleFileType)
    jsBundleAsset.url = bundleUrl
    jsBundleAsset.isLaunchAsset = true
    jsBundleAsset.mainBundleFilename = EmbeddedAppLoader.EXUpdatesEmbeddedBundleFilename
    jsBundleAsset.extraRequestHeaders = bundleKey.let { it in
      assetHeaders.optionalValue(forKey: it)
    }
    jsBundleAsset.expectedHash = launchAsset.optionalValue(forKey: "hash")
    processedAssets.append(jsBundleAsset)

    assets?.forEach { assetDict in
      let key: String = assetDict.requiredValue(forKey: "key")
      let urlString: String = assetDict.requiredValue(forKey: "url")
      let fileExtension: String = assetDict.requiredValue(forKey: "fileExtension")
      let metadata: [String: Any]? = assetDict.optionalValue(forKey: "metadata")
      let mainBundleFilename: String? = assetDict.optionalValue(forKey: "mainBundleFilename")
      let expectedHash: String = assetDict.requiredValue(forKey: "hash")
      let url = URL(string: urlString).require("asset url should be a valid URL")

      let asset = UpdateAsset(key: key, type: fileExtension)
      asset.url = url
      asset.expectedHash = expectedHash

      if metadata != nil {
        asset.metadata = metadata
      }

      if mainBundleFilename != nil {
        asset.mainBundleFilename = mainBundleFilename
      }

      asset.extraRequestHeaders = assetHeaders.optionalValue(forKey: key)
      processedAssets.append(asset)
    }

    return Update(
      manifest: manifest,
      config: config,
      database: database,
      updateId: uuid,
      scopeKey: config.scopeKey,
      commitTime: RCTConvert.nsDate(commitTime),
      runtimeVersion: runtimeVersion,
      keep: true,
      status: UpdateStatus.StatusPending,
      isDevelopmentMode: false,
      assetsFromManifest: processedAssets
    )
  }
}
