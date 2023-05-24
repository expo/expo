//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable identifier_name
// swiftlint:disable legacy_objc_type

// this class uses an abstract class pattern
// swiftlint:disable unavailable_function

import Foundation

/**
 * Subclass of AppLoader which handles copying the embedded update's assets into the
 * expo-updates cache location.
 *
 * Rather than launching the embedded update directly from its location in the app bundle/apk, we
 * first try to read it into the expo-updates cache and database and launch it like any other
 * update. The benefits of this include (a) a single code path for launching most updates and (b)
 * assets included in embedded updates and copied into the cache in this way do not need to be
 * redownloaded if included in future updates.
 */
@objc(EXUpdatesEmbeddedAppLoader)
@objcMembers
public final class EmbeddedAppLoader: AppLoader {
  public static let EXUpdatesEmbeddedManifestName = "app"
  public static let EXUpdatesEmbeddedManifestType = "manifest"
  public static let EXUpdatesEmbeddedBundleFilename = "app"
  public static let EXUpdatesEmbeddedBundleFileType = "bundle"
  public static let EXUpdatesBareEmbeddedBundleFilename = "main"
  public static let EXUpdatesBareEmbeddedBundleFileType = "jsbundle"

  private static let ErrorDomain = "EXUpdatesEmbeddedAppLoader"

  private static var embeddedManifestInternal: Update?
  public static func embeddedManifest(withConfig config: UpdatesConfig, database: UpdatesDatabase?) -> Update? {
    guard config.hasEmbeddedUpdate else {
      return nil
    }
    if let embeddedManifestInternal = embeddedManifestInternal {
      return embeddedManifestInternal
    }

    var manifestNSData: NSData?

    let frameworkBundle = Bundle(for: EmbeddedAppLoader.self)
    if let resourceUrl = frameworkBundle.resourceURL,
      let bundle = Bundle(url: resourceUrl.appendingPathComponent("EXUpdates.bundle")),
      let path = bundle.path(
        forResource: EmbeddedAppLoader.EXUpdatesEmbeddedManifestName,
        ofType: EmbeddedAppLoader.EXUpdatesEmbeddedManifestType
      ) {
      manifestNSData = NSData(contentsOfFile: path)
    }

    // Fallback to main bundle if the embedded manifest is not found in EXUpdates.bundle. This is a special case
    // to support the existing structure of Expo "shell apps"
    if manifestNSData == nil,
      let path = Bundle.main.path(
        forResource: EmbeddedAppLoader.EXUpdatesEmbeddedManifestName,
        ofType: EmbeddedAppLoader.EXUpdatesEmbeddedManifestType
      ) {
      manifestNSData = NSData(contentsOfFile: path)
    }

    let manifestData = manifestNSData.let { it in
      it as Data
    }

    // Not found in EXUpdates.bundle or main bundle
    guard let manifestData = manifestData else {
      NSException(
        name: .internalInconsistencyException,
        reason: "The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in your Xcode Build Phases."
      )
      .raise()
      return nil
    }

    guard let manifest = try? JSONSerialization.jsonObject(with: manifestData) else {
      NSException(
        name: .internalInconsistencyException,
        reason: "The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in your Xcode Build Phases."
      )
      .raise()
      return nil
    }

    guard let manifestDictionary = manifest as? [String: Any] else {
      NSException(
        name: .internalInconsistencyException,
        reason: "embedded manifest should be a valid JSON file"
      )
      .raise()
      return nil
    }

    var mutableManifest = manifestDictionary
    // automatically verify embedded manifest since it was already codesigned
    mutableManifest["isVerified"] = true
    embeddedManifestInternal = Update.update(withEmbeddedManifest: mutableManifest, config: config, database: database)
    return embeddedManifestInternal
  }

  internal func loadUpdateResponseFromEmbeddedManifest(
    withCallback updateResponseBlock: @escaping AppLoaderUpdateResponseBlock,
    asset assetBlock: @escaping AppLoaderAssetBlock,
    success successBlock: @escaping AppLoaderSuccessBlock,
    error errorBlock: @escaping AppLoaderErrorBlock
  ) {
    guard let embeddedManifest = EmbeddedAppLoader.embeddedManifest(withConfig: config, database: database) else {
      errorBlock(NSError(
        domain: EmbeddedAppLoader.ErrorDomain,
        code: 1008,
        userInfo: [
          NSLocalizedDescriptionKey: "Failed to load embedded manifest. Make sure you have configured expo-updates correctly."
        ]
      ))
      return
    }

    self.updateResponseBlock = updateResponseBlock
    self.assetBlock = assetBlock
    self.successBlock = successBlock
    self.errorBlock = errorBlock
    startLoading(fromUpdateResponse: UpdateResponse(
      responseHeaderData: nil,
      manifestUpdateResponsePart: ManifestUpdateResponsePart(updateManifest: embeddedManifest),
      directiveUpdateResponsePart: nil
    ))
  }

  override public func downloadAsset(_ asset: UpdateAsset) {
    let destinationUrl = directory.appendingPathComponent(asset.filename)
    FileDownloader.assetFilesQueue.async {
      if FileManager.default.fileExists(atPath: destinationUrl.path) {
        DispatchQueue.global().async {
          self.handleAssetDownloadAlreadyExists(asset)
        }
      } else {
        let mainBundleFilename = asset.mainBundleFilename.require("embedded asset mainBundleFilename must be nonnull")
        let bundlePath = UpdatesUtils.path(forBundledAsset: asset).require(
          String(
            format: "Could not find the expected embedded asset in NSBundle %@.%@. " +
              "Check that expo-updates is installed correctly, and verify that assets are present in the ipa file.",
            mainBundleFilename,
            asset.type ?? ""
          )
        )

        do {
          try FileManager.default.copyItem(atPath: bundlePath, toPath: destinationUrl.path)
          let data = try NSData(contentsOfFile: bundlePath) as Data
          DispatchQueue.global().async {
            self.handleAssetDownload(withData: data, response: nil, asset: asset)
          }
        } catch {
          DispatchQueue.global().async {
            self.handleAssetDownload(withError: error, asset: asset)
          }
        }
      }
    }
  }

  override internal func loadUpdate(
    fromURL url: URL,
    onUpdateResponse updateResponseBlock: @escaping AppLoaderUpdateResponseBlock,
    asset assetBlock: @escaping AppLoaderAssetBlock,
    success successBlock: @escaping AppLoaderSuccessBlock,
    error errorBlock: @escaping AppLoaderErrorBlock
  ) {
    preconditionFailure("Should not call EmbeddedAppLoader#loadUpdateFromUrl")
  }
}
