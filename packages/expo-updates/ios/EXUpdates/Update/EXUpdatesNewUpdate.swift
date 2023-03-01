//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation
import EXManifests
import EXStructuredHeaders

@objcMembers public class EXUpdatesNewUpdate: EXUpdatesUpdate {
  /**
   * Method for initializing updates with modern format manifests that conform to the Expo Updates
   * specification (https://docs.expo.dev/technical-specs/expo-updates-0/). This is used by EAS
   * Update.
   */
  public static func update(
    withNewManifest: EXManifestsNewManifest,
    manifestHeaders: EXUpdatesManifestHeaders,
    extensions: [String: Any],
    config: EXUpdatesConfig,
    database: EXUpdatesDatabase
  ) -> EXUpdatesUpdate {
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

    var processedAssets: [EXUpdatesAsset] = []

    let bundleKey: String? = launchAsset.optionalValue(forKey: "key")
    // TODO-JJ save launch assets with no file extension to match android
    let jsBundleAsset = EXUpdatesAsset(key: bundleKey, type: EXUpdatesEmbeddedBundleFileType)
    jsBundleAsset.url = bundleUrl
    jsBundleAsset.isLaunchAsset = true
    jsBundleAsset.mainBundleFilename = EXUpdatesEmbeddedBundleFilename
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

      let asset = EXUpdatesAsset(key: key, type: fileExtension)
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

    let update = EXUpdatesUpdate.init(
      manifest: manifest,
      config: config,
      database: database,
      updateId: uuid,
      scopeKey: config.scopeKey.require("Must supply scopeKey in configuration"),
      commitTime: RCTConvert.nsDate(commitTime),
      runtimeVersion: runtimeVersion,
      keep: true,
      status: EXUpdatesUpdateStatus.StatusPending,
      isDevelopmentMode: false,
      assetsFromManifest: processedAssets
    )
    update.serverDefinedHeaders = EXUpdatesNewUpdate.dictionaryWithStructuredHeader(manifestHeaders.serverDefinedHeaders)
    update.manifestFilters = EXUpdatesNewUpdate.dictionaryWithStructuredHeader(manifestHeaders.manifestFilters)
    return update
  }

  public static func dictionaryWithStructuredHeader(_ headerString: String?) -> [String: Any]? {
    guard let headerString = headerString else {
      return nil
    }
    let parser = EXStructuredHeadersParser.init(
      rawInput: headerString,
      fieldType: EXStructuredHeadersParserFieldType.dictionary,
      ignoringParameters: true
    )
    let parserOutput: Any
    do {
      parserOutput = try parser.parseStructuredFields()
    } catch let error as NSError {
      NSLog("Error parsing header value: %@", error.localizedDescription)
      return nil
    }

    guard let parserOutputDictionary = parserOutput as? [String: Any] else {
      NSLog("Error parsing header value: %@", "Header was not a structured fields dictionary")
      return nil
    }

    // ignore any dictionary entries whose type is not string, number, or boolean
    // since this will be re-serialized to JSON
    // The only way I can figure out how to detect numbers is to do a isNSNumber (is any Numeric didn't work)
    // swiftlint:disable:next legacy_objc_type
    return parserOutputDictionary.filter { $0.value is String || $0.value is NSNumber || $0.value is Bool }
  }
}
