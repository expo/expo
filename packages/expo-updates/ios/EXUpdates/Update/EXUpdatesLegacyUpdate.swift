//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation
import EXManifests

@objcMembers
public class EXUpdatesLegacyUpdate: EXUpdatesUpdate {
  /**
   * Method for initializing updates with manifests in the classic format (i.e. come from Expo's
   * classic updates service or a self-hosted service following the classic updates format, such as
   * one making use of `expo-cli export`).
   *
   * Asset URLs are relative in this format, and we assume that if no base URL is explicitly provided,
   * the base URL is Expo's classic asset CDN.
   */
  public static func update(
    withLegacyManifest: EXManifestsLegacyManifest,
    config: EXUpdatesConfig,
    database: EXUpdatesDatabase?
  ) -> EXUpdatesUpdate {
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
    var status: EXUpdatesUpdateStatus
    if manifest.isDevelopmentMode() {
      isDevelopmentMode = true
      status = EXUpdatesUpdateStatus.StatusDevelopment
    } else {
      status = EXUpdatesUpdateStatus.StatusPending
    }

    let bundleUrlString = manifest.bundleUrl()
    let assets = manifest.bundledAssets() ?? []

    var runtimeVersion: String
    let manifestRuntimeVersion = manifest.runtimeVersion()
    if let manifestRuntimeVersion = manifestRuntimeVersion {
      runtimeVersion = assertType(value: manifestRuntimeVersion, description: "Manifest JSON runtime version must be string")
    } else {
      runtimeVersion = manifest.sdkVersion().require("Manifest JSON must have a valid sdkVersion property defined")
    }

    let bundleUrl = URL(string: bundleUrlString).require("Manifest JSON must have a valid URL as the bundleUrl property")

    var processedAssets: [EXUpdatesAsset] = []

    let bundleKey = manifest.bundleKey()
    let jsBundleAsset = EXUpdatesAsset(key: bundleKey, type: EXUpdatesEmbeddedBundleFileType)
    jsBundleAsset.url = bundleUrl
    jsBundleAsset.isLaunchAsset = true
    jsBundleAsset.mainBundleFilename = EXUpdatesEmbeddedBundleFilename
    processedAssets.append(jsBundleAsset)

    let bundledAssetBaseUrl = EXUpdatesLegacyUpdate.bundledAssetBaseUrl(withManifest: manifest, config: config)

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
        filename = String(bundledAssetString[...extensionStartIndex])
        let hashStartIndex = bundledAssetString.index(extensionStartIndex, offsetBy: -1 * prefixLength)
        hash = String(bundledAssetString[hashStartIndex...extensionStartIndex])
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
      let asset = EXUpdatesAsset(key: key, type: type)
      asset.url = url
      asset.mainBundleFilename = filename

      processedAssets.append(asset)
    }

    return EXUpdatesUpdate.init(
      manifest: manifest,
      config: config,
      database: database,
      updateId: updateId,
      scopeKey: config.scopeKey.require("Must supply scopeKey in configuration"),
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

  public static func bundledAssetBaseUrl(withManifest: EXManifestsLegacyManifest, config: EXUpdatesConfig) -> URL {
    let manifestUrl = config.updateUrl
    let host = manifestUrl?.host

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
    } else {
      let assetsPathOrUrl = withManifest.assetUrlOverride() ?? "assets"
      // assetUrlOverride may be an absolute or relative URL
      // if relative, we should resolve with respect to the manifest URL
      return URL(string: assetsPathOrUrl, relativeTo: manifestUrl).require(
        "Invalid assetUrlOverride"
      ).absoluteURL.standardized
    }
  }
}
