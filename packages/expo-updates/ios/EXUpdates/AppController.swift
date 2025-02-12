//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable line_length
// swiftlint:disable force_unwrapping
// swiftlint:disable identifier_name

import Foundation
import ExpoModulesCore
import EXUpdatesInterface

public struct UpdatesModuleConstants {
  public init(
    launchedUpdate: Update?,
    launchDuration: Double?,
    embeddedUpdate: Update?,
    emergencyLaunchException: Error?,
    isEnabled: Bool,
    isUsingEmbeddedAssets: Bool,
    runtimeVersion: String?,
    checkOnLaunch: CheckAutomaticallyConfig,
    requestHeaders: [String: String],
    assetFilesMap: [String: Any]?,
    shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: Bool,
    initialContext: UpdatesStateContext
  ) {
    self.launchedUpdate = launchedUpdate
    self.launchDuration = launchDuration
    self.embeddedUpdate = embeddedUpdate
    self.emergencyLaunchException = emergencyLaunchException
    self.isEnabled = isEnabled
    self.isUsingEmbeddedAssets = isUsingEmbeddedAssets
    self.runtimeVersion = runtimeVersion
    self.checkOnLaunch = checkOnLaunch
    self.requestHeaders = requestHeaders
    self.assetFilesMap = assetFilesMap
    self.shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = shouldDeferToNativeForAPIMethodAvailabilityInDevelopment
    self.initialContext = initialContext
  }

  let launchedUpdate: Update?
  let launchDuration: Double?
  let embeddedUpdate: Update?
  let emergencyLaunchException: Error?
  let isEnabled: Bool
  let isUsingEmbeddedAssets: Bool
  let runtimeVersion: String?
  let checkOnLaunch: CheckAutomaticallyConfig
  let requestHeaders: [String: String]

  /**
   A dictionary of the locally downloaded assets for the current update. Keys are the remote URLs
   of the assets and values are local paths. This should be exported by the Updates JS module and
   can be used by `expo-asset` or a similar module to override React Native's asset resolution and
   use the locally downloaded assets.
   */
  let assetFilesMap: [String: Any]?

  /**
   Whether the JS API methods should allow calling the native module methods and thus the methods
   on the controller in development. For non-expo development we want to throw
   at the JS layer since there isn't a controller set up. But for development within Expo Go
   or a Dev Client, which have their own controller/JS API implementations, we want the JS API
   calls to go through.
   */
  let shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: Bool

  let initialContext: UpdatesStateContext

  public func toModuleConstantsMap() -> [String: Any?] {
    var mutableMap: [String: Any?] = [
      "isEmergencyLaunch": emergencyLaunchException != nil,
      "emergencyLaunchReason": emergencyLaunchException?.localizedDescription,
      "isEmbeddedLaunch": embeddedUpdate != nil && embeddedUpdate?.updateId == launchedUpdate?.updateId,
      "isEnabled": isEnabled,
      "launchDuration": launchDuration,
      "isUsingEmbeddedAssets": isUsingEmbeddedAssets,
      "runtimeVersion": runtimeVersion ?? "",
      "checkAutomatically": checkOnLaunch.asString,
      "channel": requestHeaders["expo-channel-name"] ?? "",
      "shouldDeferToNativeForAPIMethodAvailabilityInDevelopment":
        shouldDeferToNativeForAPIMethodAvailabilityInDevelopment || UpdatesUtils.isNativeDebuggingEnabled(),
      "initialContext": initialContext.json
    ]

    if let launchedUpdate = launchedUpdate {
      mutableMap["updateId"] = launchedUpdate.updateId.uuidString
      mutableMap["commitTime"] = UInt64(floor(launchedUpdate.commitTime.timeIntervalSince1970 * 1000))
      mutableMap["manifest"] = launchedUpdate.manifest.rawManifestJSON()
    }

    if let assetFilesMap = assetFilesMap {
      mutableMap["localAssets"] = assetFilesMap
    }

    return mutableMap
  }
}

public enum CheckForUpdateResult {
  case noUpdateAvailable(reason: RemoteCheckResultNotAvailableReason)
  case updateAvailable(manifest: [String: Any])
  case rollBackToEmbedded(commitTime: Date)
  case error(error: Error)
}

public enum FetchUpdateResult {
  case success(manifest: [String: Any])
  case failure
  case rollBackToEmbedded
  case error(error: Error)
}

@objc(EXUpdatesAppControllerInterface)
public protocol AppControllerInterface {
  /**
   Delegate which will be notified when EXUpdates has an update ready to launch and
   `launchAssetUrl` is nonnull.
   */
  @objc weak var delegate: AppControllerDelegate? { get set }

  /**
   The URL on disk to source asset for the RCTBridge.
   Will be null until the AppController delegate method is called.
   This should be provided in the `sourceURLForBridge:` method of RCTBridgeDelegate.
   */
  @objc func launchAssetUrl() -> URL?

  /**
   Indicates that the controller is in active state.
   Currently it's only active for `EnabledAppController`.
   */
  @objc var isActiveController: Bool { get }

  /**
   Starts the update process to launch a previously-loaded update and (if configured to do so)
   check for a new update from the server. This method should be called as early as possible in
   the application's lifecycle.

   Note that iOS may stop showing the app's splash screen in case the update is taking a while
   to load. If your splash screen setup is simple, you may want to use the
   `startAndShowLaunchScreen:` method instead.
   */
  @objc func start()
}

public protocol InternalAppControllerInterface: AppControllerInterface {
  var updatesDirectory: URL? { get }

  var eventManager: UpdatesEventManager { get }
  func onEventListenerStartObserving()

  func getConstantsForModule() -> UpdatesModuleConstants
  func requestRelaunch(
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  )
  func checkForUpdate(
    success successBlockArg: @escaping (_ checkForUpdateResult: CheckForUpdateResult) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  )
  func fetchUpdate(
    success successBlockArg: @escaping (_ fetchUpdateResult: FetchUpdateResult) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  )
  func getExtraParams(
    success successBlockArg: @escaping (_ extraParams: [String: String]?) -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  )
  func setExtraParam(
    key: String,
    value: String?,
    success successBlockArg: @escaping () -> Void,
    error errorBlockArg: @escaping (_ error: Exception) -> Void
  )
  func setUpdateURLAndRequestHeadersOverride(_ configOverride: UpdatesConfigOverride?) throws
}

@objc(EXUpdatesAppControllerDelegate)
public protocol AppControllerDelegate: AnyObject {
  func appController(_ appController: AppControllerInterface, didStartWithSuccess success: Bool)
}

/**
 * Main entry point to expo-updates. Singleton that keeps track of updates state, holds references
 * to instances of other updates classes, and is the central hub for all updates-related tasks.
 *
 * The `start` method in the singleton instance of [IUpdatesController] should be invoked early in
 * the application lifecycle, via [UpdatesPackage]. It delegates to an instance of [LoaderTask] to
 * start the process of loading and launching an update, then responds appropriately depending on
 * the callbacks that are invoked.
 *
 * This class also optionally holds a reference to the app's [ReactNativeHost], which allows
 * expo-updates to reload JS and send events through the bridge.
 */
@objc(EXUpdatesAppController)
@objcMembers
public class AppController: NSObject {
  public static func isInitialized() -> Bool {
    return _sharedInstance != nil
  }
  private static var _sharedInstance: InternalAppControllerInterface?
  public static var sharedInstance: InternalAppControllerInterface {
    assert(_sharedInstance != nil, "AppController.sharedInstace was called before the module was initialized")
    return _sharedInstance!
  }
  private static var _overrideConfig: UpdatesConfig?

  public static func initializeWithoutStarting() {
    if _sharedInstance != nil {
      return
    }

    if EXAppDefines.APP_DEBUG && !UpdatesUtils.isNativeDebuggingEnabled() {
      #if USE_DEV_CLIENT
      // Passing a reference to DevLauncherController over to the registry,
      // which expo-dev-client can access.
      let devLauncherController = initializeAsDevLauncherWithoutStarting()
      _sharedInstance = devLauncherController
      UpdatesControllerRegistry.sharedInstance.controller = devLauncherController
      #else
      _sharedInstance = DisabledAppController(error: nil)
      #endif
      return
    }

    let logger = UpdatesLogger()

    // swiftlint:disable closure_body_length
    let config = _overrideConfig != nil ? _overrideConfig : {
      let updatesConfigurationValidationResult = UpdatesConfig.getUpdatesConfigurationValidationResult(mergingOtherDictionary: nil)
      switch updatesConfigurationValidationResult {
      case .Valid:
        guard let config = try? UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: nil) else {
          NSException(
            name: .internalInconsistencyException,
            reason: "Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
          )
          .raise()
          return nil
        }
        return config
      case .InvalidPlistError:
        logger.warn(
          message: "The expo-updates system is disabled due to an invalid configuration. Ensure a valid Expo.plist is present in the application bundle.",
          code: .initializationError
        )
      case .InvalidNotEnabled:
        logger.warn(
          message: "The expo-updates system is explicitly disabled. To enable it, set the enabled setting to true.",
          code: .initializationError
        )
      case .InvalidMissingURL:
        logger.warn(
          message: "The expo-updates system is disabled due to an invalid configuration. Ensure a valid URL is supplied.",
          code: .initializationError
        )
      case .InvalidMissingRuntimeVersion:
        logger.warn(
          message: "The expo-updates system is disabled due to an invalid configuration. Ensure a runtime version is supplied.",
          code: .initializationError
        )
      }
      return nil
    }()
    // swiftlint:enable closure_body_length

    if let config = config {
      let updatesDatabase = UpdatesDatabase()
      do {
        let directory = try initializeUpdatesDirectory()
        try initializeUpdatesDatabase(updatesDatabase: updatesDatabase, inUpdatesDirectory: directory)
        _sharedInstance = EnabledAppController(config: config, database: updatesDatabase, updatesDirectory: directory)
      } catch {
        let cause = UpdatesError.appControllerInitializationError(cause: error)
        logger.error(
          cause: cause,
          code: .initializationError
        )
        _sharedInstance = DisabledAppController(error: cause)
        return
      }
    } else {
      _sharedInstance = DisabledAppController(error: nil)
    }
  }

  public static func overrideConfiguration(configuration: [String: Any]?) {
    if _sharedInstance != nil {
      fatalError("The method should be called before AppController.initializeWithoutStarting()")
    }
    let updatesConfigurationValidationResult = UpdatesConfig.getUpdatesConfigurationValidationResult(mergingOtherDictionary: configuration)
    if updatesConfigurationValidationResult == UpdatesConfigurationValidationResult.Valid {
      do {
        _overrideConfig = try UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: configuration)
      } catch {
        UpdatesLogger().warn(message: "Failed to overrideConfiguration: invalid configuration: Cannot load configuration from Expo.plist")
      }
    } else {
      UpdatesLogger().warn(message: "Failed to overrideConfiguration: \(updatesConfigurationValidationResult)")
    }
  }

  private static func initializeAsDevLauncherWithoutStarting() -> DevLauncherAppController {
    assert(_sharedInstance == nil, "UpdatesController must not be initialized prior to calling initializeAsDevLauncherWithoutStarting")

    var config: UpdatesConfig?
    if UpdatesConfig.getUpdatesConfigurationValidationResult(mergingOtherDictionary: nil) == UpdatesConfigurationValidationResult.Valid {
      config = try? UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: nil)
    }

    var updatesDirectory: URL?
    let updatesDatabase = UpdatesDatabase()
    var directoryDatabaseException: Error?
    do {
      updatesDirectory = try initializeUpdatesDirectory()
      try initializeUpdatesDatabase(updatesDatabase: updatesDatabase, inUpdatesDirectory: updatesDirectory!)
    } catch {
      directoryDatabaseException = error
    }

    let appController = DevLauncherAppController(
      initialUpdatesConfiguration: config,
      updatesDirectory: updatesDirectory,
      updatesDatabase: updatesDatabase,
      directoryDatabaseException: directoryDatabaseException
    )
    _sharedInstance = appController
    return appController
  }

  private static func initializeUpdatesDirectory() throws -> URL {
    return try UpdatesUtils.initializeUpdatesDirectory()
  }

  private static func initializeUpdatesDatabase(updatesDatabase: UpdatesDatabase, inUpdatesDirectory updatesDirectory: URL) throws {
    var dbError: Error?
    let semaphore = DispatchSemaphore(value: 0)
    updatesDatabase.databaseQueue.async {
      do {
        try updatesDatabase.openDatabase(inDirectory: updatesDirectory)
      } catch {
        dbError = error
      }
      semaphore.signal()
    }

    _ = semaphore.wait(timeout: .distantFuture)

    if let dbError = dbError {
      throw dbError
    }
  }

  internal static func setUpdatesEventManagerObserver(_ observer: UpdatesEventManagerObserver) {
    _sharedInstance?.eventManager.observer = observer
    _sharedInstance?.onEventListenerStartObserving()
  }

  internal static func removeUpdatesEventManagerObserver() {
    _sharedInstance?.eventManager.observer = nil
  }
}

// swiftlint:enable identifier_name
// swiftlint:enable force_unwrapping
// swiftlint:enable line_length
