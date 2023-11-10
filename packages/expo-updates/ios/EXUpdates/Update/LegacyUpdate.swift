//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation
import EXManifests

public final class LegacyUpdate: Update {
  /**
   * Method for initializing updates with manifests in the classic format (i.e. come from Expo's
   * classic updates service or a self-hosted service following the classic updates format, such as
   * one making use of `expo-cli export`).
   *
   * Asset URLs are relative in this format, and we assume that if no base URL is explicitly provided,
   * the base URL is Expo's classic asset CDN.
   */
  public static func update(
    withLegacyManifest: LegacyManifest,
    config: UpdatesConfig,
    database: UpdatesDatabase?
  ) -> Update {
    let manifest = withLegacyManifest

    var updateId: UUID
    var commitTime: Date
    if manifest.isUsingDeveloperTool() {
      // XDL does not set a releaseId or commitTime for development manifests.
      // we do not need these so we just stub them out
      updateId = UUID()
      commitTime = Date()
    } else {
      updateId = UUID(uuidString: manifest.releaseID()).require("updateId should be a valid UUID")
      let commitTimeString = manifest.commitTime()
      commitTime = RCTConvert.nsDate(commitTimeString)
    }

    var isDevelopmentMode: Bool = false
    var status: UpdateStatus
    if manifest.isDevelopmentMode() {
      isDevelopmentMode = true
      status = UpdateStatus.StatusDevelopment
    } else {
      status = UpdateStatus.StatusPending
    }

    let bundleUrlString = manifest.bundleUrl()
    let assets = manifest.bundledAssets() ?? []

    var runtimeVersion: String
    let manifestRuntimeVersion = manifest.runtimeVersion()
    if let manifestRuntimeVersion = manifestRuntimeVersion as? String {
      runtimeVersion = manifestRuntimeVersion
    } else {
      runtimeVersion = manifest.expoGoSDKVersion().require("Manifest JSON must have either a valid runtimeVersion property or a valid sdkVersion property")
    }

    let bundleUrl = URL(string: bundleUrlString).require("Manifest JSON must have a valid URL as the bundleUrl property")

    var processedAssets: [UpdateAsset] = []

    let bundleKey = manifest.bundleKey()
    let jsBundleAsset = UpdateAsset(key: bundleKey, type: EmbeddedAppLoader.EXUpdatesEmbeddedBundleFileType)
    jsBundleAsset.url = bundleUrl
    jsBundleAsset.isLaunchAsset = true
    jsBundleAsset.mainBundleFilename = EmbeddedAppLoader.EXUpdatesEmbeddedBundleFilename
    processedAssets.append(jsBundleAsset)

    let bundledAssetBaseUrl = LegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: config)

    assets.forEach { bundledAsset in
      let bundledAssetString: String = assertType(
        value: bundledAsset,
        description: "Manifest JSON bundledAssets property must be an array of strings, found unexpected value"
      )
      let extensionStartIndex = bundledAssetString.lastIndex(of: ".")
      let prefixLength = "asset_".count

      var filename: String
      var hash: String
      var type: String

      if let extensionStartIndex = extensionStartIndex {
        filename = String(bundledAssetString[..<extensionStartIndex])
        let hashStartIndex = bundledAssetString.index(bundledAssetString.startIndex, offsetBy: prefixLength)
        hash = String(bundledAssetString[hashStartIndex..<extensionStartIndex])
        let typeStartIndex = bundledAssetString.index(extensionStartIndex, offsetBy: 1)
        type = String(bundledAssetString[typeStartIndex...])
      } else {
        filename = bundledAssetString
        let bundledAssetStringIndex = bundledAssetString.index(bundledAssetString.startIndex, offsetBy: prefixLength)
        hash = String(bundledAssetString[bundledAssetStringIndex...])
        type = ""
      }

      let url = bundledAssetBaseUrl.appendingPathComponent(hash)
      let key = hash
      let asset = UpdateAsset(key: key, type: type)
      asset.url = url
      asset.mainBundleFilename = filename

      processedAssets.append(asset)
    }

    return Update.init(
      manifest: manifest,
      config: config,
      database: database,
      updateId: updateId,
      scopeKey: config.scopeKey,
      commitTime: commitTime,
      runtimeVersion: runtimeVersion,
      keep: true,
      status: status,
      isDevelopmentMode: isDevelopmentMode,
      assetsFromManifest: processedAssets
    )
  }

  private static let EXUpdatesExpoAssetBaseUrl = "https://classic-assets.eascdn.net/~assets/"
  private static let EXUpdatesExpoIoDomain = "expo.io"
  private static let EXUpdatesExpHostDomain = "exp.host"
  private static let EXUpdatesExpoTestDomain = "expo.test"

  static func bundledAssetBaseUrl(withManifest: LegacyManifest, config: UpdatesConfig) -> URL {
    let manifestUrl = config.updateUrl
    let host = manifestUrl.host

    guard let host = host else {
      // The URL is valid and constant, so it'll never throw
      // swiftlint:disable:next force_unwrapping
      return URL(string: EXUpdatesExpoAssetBaseUrl)!
    }

    if host.contains(EXUpdatesExpoIoDomain) ||
      host.contains(EXUpdatesExpHostDomain) ||
      host.contains(EXUpdatesExpoTestDomain) {
      // The URL is valid and constant, so it'll never throw
      // swiftlint:disable:next force_unwrapping
      return URL(string: EXUpdatesExpoAssetBaseUrl)!
    }

    let assetsPathOrUrl = withManifest.assetUrlOverride() ?? "assets"
    // assetUrlOverride may be an absolute or relative URL
    // if relative, we should resolve with respect to the manifest URL
    return URL(string: assetsPathOrUrl, relativeTo: manifestUrl).require(
      "Invalid assetUrlOverride"
    ).absoluteURL.standardized
  }
}
