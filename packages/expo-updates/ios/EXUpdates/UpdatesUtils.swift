//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping
// swiftlint:disable closure_body_length
// swiftlint:disable superfluous_else

import Foundation
import SystemConfiguration
import CommonCrypto
import Reachability
import ExpoModulesCore

internal extension Array where Element: Equatable {
  mutating func remove(_ element: Element) {
    if let index = firstIndex(of: element) {
      remove(at: index)
    }
  }
}

@objc(EXUpdatesUtils)
@objcMembers
public final class UpdatesUtils: NSObject {
  private static let EXUpdatesEventName = "Expo.nativeUpdatesEvent"
  private static let EXUpdatesUtilsErrorDomain = "EXUpdatesUtils"
  public static let methodQueue = DispatchQueue(label: "expo.modules.EXUpdatesQueue")

  // MARK: - Public methods

  public static func initializeUpdatesDirectory() throws -> URL {
    let fileManager = FileManager.default
    let applicationDocumentsDirectory = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).last!
    let updatesDirectory = applicationDocumentsDirectory.appendingPathComponent(".expo-internal")
    let updatesDirectoryPath = updatesDirectory.path

    var isDir = ObjCBool(false)
    let exists = fileManager.fileExists(atPath: updatesDirectoryPath, isDirectory: &isDir)

    if exists {
      if !isDir.boolValue {
        throw NSError(
          domain: EXUpdatesUtilsErrorDomain,
          code: 1005,
          userInfo: [
            NSLocalizedDescriptionKey: "Failed to create the Updates Directory; a file already exists with the required directory name"
          ]
        )
      }
    } else {
      try fileManager.createDirectory(atPath: updatesDirectoryPath, withIntermediateDirectories: true)
    }
    return updatesDirectory
  }

  /**
   The implementation of checkForUpdateAsync().
   The UpdatesService is passed in when this is called from JS through UpdatesModule
   */
  public static func checkForUpdate(_ block: @escaping ([String: Any]) -> Void) {
    sendStateEvent(UpdatesStateEventCheck())
    do {
      let constants = try startJSAPICall()

      var extraHeaders: [String: Any] = [:]
      constants.database.databaseQueue.sync {
        extraHeaders = FileDownloader.extraHeadersForRemoteUpdateRequest(
          withDatabase: constants.database,
          config: constants.config,
          launchedUpdate: constants.launchedUpdate,
          embeddedUpdate: constants.embeddedUpdate
        )
      }

      let fileDownloader = FileDownloader(config: constants.config)
      fileDownloader.downloadRemoteUpdate(
        fromURL: constants.config.updateUrl!,
        withDatabase: constants.database,
        extraHeaders: extraHeaders
      ) { updateResponse in
        if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
          switch updateDirective {
          case is NoUpdateAvailableUpdateDirective:
            block([:])
            sendStateEvent(UpdatesStateEventCheckComplete())
            return
          case is RollBackToEmbeddedUpdateDirective:
            let body = [
              "isRollBackToEmbedded": true
            ]
            block(body)
            sendStateEvent(UpdatesStateEventCheckCompleteWithRollback())
            return
          default:
            return handleCheckError(UpdatesUnsupportedDirectiveException(), block: block)
          }
        }

        guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
          block([:])
          sendStateEvent(UpdatesStateEventCheckComplete())
          return
        }

        if constants.selectionPolicy.shouldLoadNewUpdate(
          update,
          withLaunchedUpdate: constants.launchedUpdate,
          filters: updateResponse.responseHeaderData?.manifestFilters
        ) {
          let body = [
            "manifest": update.manifest!.rawManifestJSON()
          ]
          block(body)
          sendStateEvent(UpdatesStateEventCheckCompleteWithUpdate(manifest: update.manifest!.rawManifestJSON()))
        } else {
          block([:])
            sendStateEvent(UpdatesStateEventCheckComplete())
        }
      } errorBlock: { error in
        return handleCheckError(error, block: block)
      }
    } catch {
      return handleCheckError(error, block: block)
    }
  }

  /**
   The implementation of fetchUpdateAsync().
   The UpdatesService is passed in when this is called from JS through UpdatesModule
   */
  public static func fetchUpdate(_ block: @escaping ([String: Any]) -> Void) {
    sendStateEvent(UpdatesStateEventDownload())
    do {
      let constants = try startJSAPICall()
      let remoteAppLoader = RemoteAppLoader(
        config: constants.config,
        database: constants.database,
        directory: constants.directory,
        launchedUpdate: constants.launchedUpdate,
        completionQueue: methodQueue
      )
      remoteAppLoader.loadUpdate(
        fromURL: constants.config.updateUrl!
      ) { updateResponse in
        if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
          switch updateDirective {
          case is NoUpdateAvailableUpdateDirective:
            return false
          case is RollBackToEmbeddedUpdateDirective:
            return true
          default:
            NSException(name: .internalInconsistencyException, reason: "Unhandled update directive type").raise()
            return false
          }
        }

        guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
          return false
        }

        return constants.selectionPolicy.shouldLoadNewUpdate(
          update,
          withLaunchedUpdate: constants.launchedUpdate,
          filters: updateResponse.responseHeaderData?.manifestFilters
        )
      } asset: { asset, successfulAssetCount, failedAssetCount, totalAssetCount in
        let body = [
          "assetInfo": [
            "assetName": asset.filename,
            "successfulAssetCount": successfulAssetCount,
            "failedAssetCount": failedAssetCount,
            "totalAssetCount": totalAssetCount
          ] as [String: Any]
        ] as [String: Any]
        AppController.sharedInstance.logger.info(
          message: "fetchUpdateAsync didLoadAsset: \(body)",
          code: .none,
          updateId: nil,
          assetId: asset.contentHash
        )
      } success: { updateResponse in
        if updateResponse?.directiveUpdateResponsePart?.updateDirective is RollBackToEmbeddedUpdateDirective {
          let body = [
            "isNew": false,
            "isRollBackToEmbedded": true
          ]
          block(body)
          sendStateEvent(UpdatesStateEventDownloadCompleteWithRollback())
          return
        } else {
          if let update = updateResponse?.manifestUpdateResponsePart?.updateManifest {
            AppController.sharedInstance.resetSelectionPolicyToDefault()
            let body = [
              "isNew": true,
              "isRollBackToEmbedded": false,
              "manifest": update.manifest!.rawManifestJSON()
            ] as [String: Any]
            block(body)
            sendStateEvent(UpdatesStateEventDownloadCompleteWithUpdate(manifest: update.manifest!.rawManifestJSON()))
            return
          } else {
            let body = [
              "isNew": false,
              "isRollBackToEmbedded": false
            ]
            block(body)
            sendStateEvent(UpdatesStateEventDownloadComplete())
            return
          }
        }
      } error: { error in
        return handleFetchError(error, block: block)
      }
    } catch {
      handleFetchError(error, block: block)
    }
  }

  // MARK: - Internal methods

  internal static func shouldCheckForUpdate(withConfig config: UpdatesConfig) -> Bool {
    func isConnectedToWifi() -> Bool {
      do {
        return try Reachability().connection == .wifi
      } catch {
        return false
      }
    }

    switch config.checkOnLaunch {
    case .Always:
      return true
    case .WifiOnly:
      return isConnectedToWifi()
    case .Never:
      return false
    case .ErrorRecoveryOnly:
      // check will happen later on if there's an error
      return false
    }
  }

  internal static func sendStateEvent(_ event: UpdatesStateEvent) {
    AppController.sharedInstance.stateMachine?.processEvent(event)
  }

  internal static func getRuntimeVersion(withConfig config: UpdatesConfig) -> String {
    // various places in the code assume that we have a nonnull runtimeVersion, so if the developer
    // hasn't configured either runtimeVersion or sdkVersion, we'll use a dummy value of "1" but warn
    // the developer in JS that they need to configure one of these values
    return config.runtimeVersion ?? config.sdkVersion ?? "1"
  }

  internal static func url(forBundledAsset asset: UpdateAsset) -> URL? {
    guard let mainBundleDir = asset.mainBundleDir else {
      return Bundle.main.url(forResource: asset.mainBundleFilename, withExtension: asset.type)
    }
    return Bundle.main.url(forResource: asset.mainBundleFilename, withExtension: asset.type, subdirectory: mainBundleDir)
  }

  internal static func path(forBundledAsset asset: UpdateAsset) -> String? {
    guard let mainBundleDir = asset.mainBundleDir else {
      return Bundle.main.path(forResource: asset.mainBundleFilename, ofType: asset.type)
    }
    return Bundle.main.path(forResource: asset.mainBundleFilename, ofType: asset.type, inDirectory: mainBundleDir)
  }

  /**
   Purges entries in the expo-updates log file that are older than 1 day
   */
  internal static func purgeUpdatesLogsOlderThanOneDay() {
    UpdatesLogReader().purgeLogEntries { error in
      if let error = error {
        NSLog("UpdatesUtils: error in purgeOldUpdatesLogs: %@", error.localizedDescription)
      }
    }
  }

  internal static func isNativeDebuggingEnabled() -> Bool {
    #if EX_UPDATES_NATIVE_DEBUG
    return true
    #else
    return false
    #endif
  }

  internal static func runBlockOnMainThread(_ block: @escaping () -> Void) {
    if Thread.isMainThread {
      block()
    } else {
      DispatchQueue.main.async {
        block()
      }
    }
  }

  internal static func hexEncodedSHA256WithData(_ data: Data) -> String {
    var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes { bytes in
      _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &digest)
    }
    return digest.reduce("") { $0 + String(format: "%02x", $1) }
  }

  internal static func base64UrlEncodedSHA256WithData(_ data: Data) -> String {
    var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes { bytes in
      _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &digest)
    }
    let base64EncodedDigest = Data(digest).base64EncodedString()

    // ref. https://datatracker.ietf.org/doc/html/rfc4648#section-5
    return base64EncodedDigest
      .trimmingCharacters(in: CharacterSet(charactersIn: "=")) // remove extra padding
      .replacingOccurrences(of: "+", with: "-") // replace "+" character w/ "-"
      .replacingOccurrences(of: "/", with: "_") // replace "/" character w/ "_"
  }

  // MARK: - Private methods used by API calls

  /**
   If any error occurs in checkForUpdate(), this will call the
   completion block and fire the error notification
   */
  private static func handleCheckError(_ error: Error, block: @escaping ([String: Any]) -> Void) {
    let body = ["message": error.localizedDescription]
    sendStateEvent(UpdatesStateEventCheckError(message: error.localizedDescription))
    block(body)
  }

  /**
   If any error occurs in fetchUpdate(), this will call the
   completion block and fire the error notification
   */
  private static func handleFetchError(_ error: Error, block: @escaping ([String: Any]) -> Void) {
    let body = ["message": error.localizedDescription]
    sendStateEvent(UpdatesStateEventDownloadError(message: error.localizedDescription))
    block(body)
  }

  /**
   Code that runs at the start of both checkForUpdate and fetchUpdate, to do sanity
   checks and return the config, selection policy, database, etc.
   When called from JS, the UpdatesService object will be passed in.
   When called from elsewhere (e.g. in response to a notification),
   a nil object is passed in, in which case we return the results directly
   from the AppController.
   Throws if expo-updates is not enabled or not started.
   */
  private static func startJSAPICall() throws -> (
    config: UpdatesConfig,
    selectionPolicy: SelectionPolicy,
    database: UpdatesDatabase,
    directory: URL,
    launchedUpdate: Update?,
    embeddedUpdate: Update?
  ) {
    let maybeConfig: UpdatesConfig? = AppController.sharedInstance.config
    let maybeSelectionPolicy: SelectionPolicy? = AppController.sharedInstance.selectionPolicy()
    let maybeIsStarted: Bool? = AppController.sharedInstance.isStarted

    guard let config = maybeConfig,
      let selectionPolicy = maybeSelectionPolicy,
      config.isEnabled
    else {
      throw UpdatesDisabledException()
    }
    guard maybeIsStarted ?? false else {
      throw UpdatesNotInitializedException()
    }

    let database = AppController.sharedInstance.database
    let launchedUpdate = AppController.sharedInstance.launchedUpdate()
    let embeddedUpdate = EmbeddedAppLoader.embeddedManifest(withConfig: config, database: database)
    guard let directory = AppController.sharedInstance.updatesDirectory else {
      throw UpdatesNotInitializedException()
    }
    return (config, selectionPolicy, database, directory, launchedUpdate, embeddedUpdate)
  }
}

// swiftlint:enable force_unwrapping
// swiftlint:enable closure_body_length
// swiftlint:enable superfluous_else
