//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable legacy_objc_type

// this class uses an abstract class pattern
// swiftlint:disable unavailable_function

import Foundation

/**
 * Subclass of AppLoader which loads the embedded update.
 *
 * By default (`EX_UPDATES_COPY_EMBEDDED_ASSETS` off) the update is registered but its assets aren't
 * read into the database; it keeps StatusEmbedded and launches from the app binary, so first launch
 * stays fast. When the flag is on, assets are read into the database and it launches like any other
 * update, so a later update reusing them avoids a redownload.
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

  private static var embeddedManifestInternal: EmbeddedUpdate?

  /// Whether to read and hash embedded assets into the database on first launch. Defaults to the
  /// build-time `EX_UPDATES_COPY_EMBEDDED_ASSETS` flag (off). Overridable for testing.
  internal var shouldCopyEmbeddedAssets: Bool = UpdatesUtils.shouldCopyEmbeddedAssets()

  internal let completionQueue: DispatchQueue

  public required override init(
    config: UpdatesConfig,
    logger: UpdatesLogger,
    database: UpdatesDatabase,
    directory: URL,
    launchedUpdate: Update?,
    completionQueue: DispatchQueue
  ) {
    self.completionQueue = completionQueue
    super.init(config: config, logger: logger, database: database, directory: directory, launchedUpdate: launchedUpdate, completionQueue: completionQueue)
  }

  /**
   Gets the embedded update.
   If the `UpdatesConfig.hasEmbeddedUpdate` is false, it returns nil
   */
  public static func embeddedManifest(withConfig config: UpdatesConfig, database: UpdatesDatabase?) -> EmbeddedUpdate? {
    guard config.hasEmbeddedUpdate else {
      return nil
    }
    return cachedEmbeddedManifest(withConfig: config, database: database)
  }

  /**
   Gets the embedded update.
   If the `UpdatesConfig.originalHasEmbeddedUpdate` is false, it returns nil
   */
  public static func originalEmbeddedManifest(withConfig config: UpdatesConfig, database: UpdatesDatabase?) -> EmbeddedUpdate? {
    guard config.originalHasEmbeddedUpdate else {
      return nil
    }
    return cachedEmbeddedManifest(withConfig: config, database: database)
  }

  /*
   Gets the embedded update even if `UpdatesConfig.hasEmbeddedUpdate` is false
   */
  private static func cachedEmbeddedManifest(withConfig config: UpdatesConfig, database: UpdatesDatabase?) -> EmbeddedUpdate {
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
      fatalError("Should never reach here")
    }

    guard let manifest = try? JSONSerialization.jsonObject(with: manifestData) else {
      NSException(
        name: .internalInconsistencyException,
        reason: "The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in your Xcode Build Phases."
      )
      .raise()
      fatalError("Should never reach here")
    }

    guard let manifestDictionary = manifest as? [String: Any] else {
      NSException(
        name: .internalInconsistencyException,
        reason: "embedded manifest should be a valid JSON file"
      )
      .raise()
      fatalError("Should never reach here")
    }

    var mutableManifest = manifestDictionary
    // automatically verify embedded manifest since it was already codesigned
    mutableManifest["isVerified"] = true
    let update = Update.update(withRawEmbeddedManifest: mutableManifest, config: config, database: database)
    embeddedManifestInternal = update
    return update
  }

  internal func loadUpdateResponseFromEmbeddedManifest(
    withCallback updateResponseBlock: @escaping AppLoaderUpdateResponseBlock,
    asset assetBlock: @escaping AppLoaderAssetBlock,
    success successBlock: @escaping AppLoaderSuccessBlock,
    error errorBlock: @escaping AppLoaderErrorBlock
  ) {
    guard let embeddedManifest = EmbeddedAppLoader.embeddedManifest(withConfig: config, database: database) else {
      errorBlock(UpdatesError.embeddedAppLoaderEmbeddedManifestLoadFailed)
      return
    }

    self.updateResponseBlock = updateResponseBlock
    self.assetBlock = assetBlock
    self.successBlock = successBlock
    self.errorBlock = errorBlock
    startEmbeddedLoad(fromEmbeddedManifest: embeddedManifest)
  }

  /// Loads the embedded update: with copying off (default) registers it without ingesting assets,
  /// otherwise loads them like any other update. Separate from `loadUpdateResponseFromEmbeddedManifest`
  /// so tests can pass a manifest without reading the bundle.
  internal func startEmbeddedLoad(fromEmbeddedManifest embeddedManifest: Update) {
    if !shouldCopyEmbeddedAssets {
      registerEmbeddedUpdateWithoutCopying(embeddedManifest)
      return
    }

    startLoading(fromUpdateResponse: UpdateResponse(
      responseHeaderData: nil,
      manifestUpdateResponsePart: ManifestUpdateResponsePart(updateManifest: embeddedManifest),
      directiveUpdateResponsePart: nil
    ))
  }

  /// Registers the embedded update without reading, hashing, or copying its assets. A StatusEmbedded
  /// update resolves its bundle and assets from the app binary at launch. Tradeoff: a future update
  /// reusing an embedded asset re-downloads it.
  private func registerEmbeddedUpdateWithoutCopying(_ embeddedManifest: Update) {
    database.databaseQueue.async {
      do {
        let existingUpdate = try? self.database.update(withId: embeddedManifest.updateId, config: self.config)
        if existingUpdate == nil {
          try self.database.addUpdate(embeddedManifest, config: self.config)
        }
        // Mark finished (keep = 1) so the reaper retains it; it stays StatusEmbedded since copying is off.
        try self.database.markUpdateFinished(embeddedManifest)
      } catch {
        let errorBlock = self.errorBlock
        self.completionQueue.async {
          errorBlock?(UpdatesError.appLoaderUnknownError(cause: error))
          self.reset()
        }
        return
      }

      let successBlock = self.successBlock
      let updateResponse = UpdateResponse(
        responseHeaderData: nil,
        manifestUpdateResponsePart: ManifestUpdateResponsePart(updateManifest: embeddedManifest),
        directiveUpdateResponsePart: nil
      )
      self.completionQueue.async {
        successBlock?(updateResponse)
        self.reset()
      }
    }
  }

  override public func downloadAsset(_ asset: UpdateAsset, extraHeaders: [String: Any]) {
    FileDownloader.assetFilesQueue.async {
      self.handleAssetDownloadAlreadyExists(asset)
    }
  }

  override public func loadUpdate(
    fromURL url: URL,
    onUpdateResponse updateResponseBlock: @escaping AppLoaderUpdateResponseBlock,
    asset assetBlock: @escaping AppLoaderAssetBlock,
    success successBlock: @escaping AppLoaderSuccessBlock,
    error errorBlock: @escaping AppLoaderErrorBlock
  ) {
    preconditionFailure("Should not call EmbeddedAppLoader#loadUpdateFromUrl")
  }
}

// swiftlint:enable legacy_objc_type
// swiftlint:enable unavailable_function
