//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable line_length
// swiftlint:disable force_unwrapping

import EXUpdatesInterface
import ExpoModulesCore

@objc(EXUpdatesDevLauncherControllerError)
enum DevLauncherAppControllerError: Int, Error, LocalizedError {
  case notEnabled
  case invalidPlist
  case invalidUpdateURL
  case invalidRuntimeVersion
  case updateLaunchFailed
  case configFailed

  var errorDescription: String? {
    switch self {
    case .notEnabled:
      return "Failed to read stored updates: configuration object is not enabled"
    case .invalidPlist:
      return "Failed to read stored updates: invalid Expo.plist"
    case .invalidUpdateURL:
      return "Failed to read stored updates: configuration object must include a valid update URL"
    case .invalidRuntimeVersion:
      return "Failed to read stored updates: configuration object must include a valid runtime version"
    case .updateLaunchFailed:
      return "Failed to launch update with an unknown error"
    case .configFailed:
      return "Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
    }
  }
}

/**
 * Main entry point to expo-updates in development builds with expo-dev-client. Similar to EnabledUpdatesController
 * in that it keeps track of updates state, but provides capabilities that are not usually exposed but
 * that expo-dev-client needs (launching and downloading a specific
 * update by URL, allowing dynamic configuration, introspecting the database). The behavior of this
 * class differs enough that it is implemented independently from EnabledUpdatesController.
 *
 * Implements the external UpdatesInterface from the expo-updates-interface package. This allows
 * expo-dev-client to compile without needing expo-updates to be installed.
 */
@objc(EXUpdatesDevLauncherController)
@objcMembers
public final class DevLauncherAppController: NSObject, InternalAppControllerInterface, UpdatesExternalInterface {
  public let eventManager: UpdatesEventManager = NoOpUpdatesEventManager()

  private let logger = UpdatesLogger()

  public weak var delegate: AppControllerDelegate?
  public weak var updatesExternalInterfaceDelegate: (any EXUpdatesInterface.UpdatesExternalInterfaceDelegate)?

  public func launchAssetUrl() -> URL? {
    return launcher?.launchAssetUrl
  }

  public var launchAssetURL: URL? {
    launcher?.launchAssetUrl
  }

  public var runtimeVersion: String? {
    config?.runtimeVersion
  }

  public var updateURL: URL? {
    config?.updateUrl
  }

  // swiftlint:disable unavailable_function
  public func start() {
    preconditionFailure("Cannot call start on DevLauncherAppController")
  }
  // swiftlint:enable unavailable_function

  private var previousUpdatesConfiguration: UpdatesConfig?
  private var config: UpdatesConfig?

  private var directoryDatabaseException: Error?
  public let updatesDirectory: URL? // internal for E2E test
  private let database: UpdatesDatabase

  private var launcher: AppLauncher?
  private let controllerQueue = DispatchQueue(label: "expo.controller.ControllerQueue")
  public let isActiveController = false

  private var _selectionPolicy: SelectionPolicy?
  private var defaultSelectionPolicy: SelectionPolicy

  required init(
    initialUpdatesConfiguration: UpdatesConfig?,
    updatesDirectory: URL?,
    updatesDatabase: UpdatesDatabase,
    directoryDatabaseException: Error?
  ) {
    self.config = initialUpdatesConfiguration
    self.updatesDirectory = updatesDirectory
    self.database = updatesDatabase
    self.directoryDatabaseException = directoryDatabaseException
    self.defaultSelectionPolicy = SelectionPolicyFactory.filterAwarePolicy(
      withRuntimeVersion: initialUpdatesConfiguration.let { it in it.runtimeVersion } ?? "1"
    )

    super.init()
  }

  public func assetFilesMap() -> [String: Any]? {
    return launcher?.assetFilesMap
  }

  public func isUsingEmbeddedAssets() -> Bool {
    guard let launcher = launcher else {
      return true
    }
    return launcher.isUsingEmbeddedAssets()
  }

  public func onEventListenerStartObserving() {
    eventManager.sendStateMachineContextEvent(context: UpdatesStateContext())
  }

  public func reset() {
    self.launcher = nil
  }

  public func fetchUpdate(
    withConfiguration configuration: [String: Any],
    onManifest manifestBlock: @escaping UpdatesManifestBlock,
    progress progressBlock: @escaping UpdatesProgressBlock,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    let updatesConfiguration: UpdatesConfig
    do {
      updatesConfiguration = try createUpdatesConfiguration(configuration)
    } catch let error {
      errorBlock(error)
      return
    }

    // since controller is a singleton, save its config so we can reset to it if our request fails
    self.previousUpdatesConfiguration = self.config

    setDevelopmentSelectionPolicy()
    self.config = updatesConfiguration

    let loader = RemoteAppLoader(
      config: updatesConfiguration,
      logger: self.logger,
      database: self.database,
      directory: self.updatesDirectory!,
      launchedUpdate: nil,
      completionQueue: self.controllerQueue
    )
    loader.loadUpdate(
      fromURL: updatesConfiguration.updateUrl
    ) { updateResponse in
      if let updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective {
        switch updateDirective {
        case is NoUpdateAvailableUpdateDirective:
          return false
        case is RollBackToEmbeddedUpdateDirective:
          return false
        default:
          NSException(name: .internalInconsistencyException, reason: "Unhandled update directive type").raise()
          return false
        }
      }

      guard let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
        return false
      }

      return manifestBlock(update.manifest.rawManifestJSON())
    } asset: { _, successfulAssetCount, failedAssetCount, totalAssetCount in
      progressBlock(UInt(successfulAssetCount), UInt(failedAssetCount), UInt(totalAssetCount))
    } success: { updateResponse in
      guard let updateResponse = updateResponse,
        let update = updateResponse.manifestUpdateResponsePart?.updateManifest else {
        successBlock(nil)
        return
      }
      self.launch(update: update, withConfiguration: updatesConfiguration, success: successBlock, error: errorBlock)
    } error: { error in
      // reset controller's configuration to what it was before this request
      self.config = self.previousUpdatesConfiguration!
      errorBlock(error)
    }
  }

  public func isValidUpdatesConfiguration(_ configuration: [String: Any]) -> Bool {
    do {
      _ = try createUpdatesConfiguration(configuration)
      return true
    } catch let error {
      logger.warn(message: "Invalid updates configuration: \(error.localizedDescription)")
    }
    return false
  }

  public func selectionPolicy() -> SelectionPolicy {
    if _selectionPolicy == nil {
      _selectionPolicy = defaultSelectionPolicy
    }
    return _selectionPolicy!
  }
  public func setNextSelectionPolicy(_ nextSelectionPolicy: SelectionPolicy) {
    _selectionPolicy = nextSelectionPolicy
  }
  public func resetSelectionPolicyToDefault() {
    _selectionPolicy = nil
  }

  private func createUpdatesConfiguration(_ configuration: [String: Any]) throws -> UpdatesConfig {
    if let directoryDatabaseException = directoryDatabaseException {
      throw directoryDatabaseException
    }

    // swiftlint:disable:next identifier_name
    let updatesConfigurationValidationResult = UpdatesConfig.getUpdatesConfigurationValidationResult(mergingOtherDictionary: configuration)
    switch updatesConfigurationValidationResult {
    case .Valid:
      break
    case .InvalidNotEnabled:
      throw DevLauncherAppControllerError.notEnabled
    case .InvalidPlistError:
      throw DevLauncherAppControllerError.invalidPlist
    case .InvalidMissingURL:
      throw DevLauncherAppControllerError.invalidUpdateURL
    case .InvalidMissingRuntimeVersion:
      throw DevLauncherAppControllerError.invalidRuntimeVersion
    }

    let updatesConfiguration: UpdatesConfig
    do {
      updatesConfiguration = try UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: configuration)
    } catch {
      throw DevLauncherAppControllerError.configFailed
    }
    return updatesConfiguration
  }

  private func setDevelopmentSelectionPolicy() {
    resetSelectionPolicyToDefault()
    let currentSelectionPolicy = selectionPolicy()
    defaultSelectionPolicy = SelectionPolicy(
      launcherSelectionPolicy: currentSelectionPolicy.launcherSelectionPolicy,
      loaderSelectionPolicy: currentSelectionPolicy.loaderSelectionPolicy,
      reaperSelectionPolicy: ReaperSelectionPolicyDevelopmentClient()
    )
    resetSelectionPolicyToDefault()
  }

  private func launch(
    update: Update,
    withConfiguration configuration: UpdatesConfig,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    // ensure that we launch the update we want, even if it isn't the latest one
    let currentSelectionPolicy = selectionPolicy()

    // Calling `setNextSelectionPolicy` allows the Updates module's `reloadAsync` method to reload
    // with a different (newer) update if one is downloaded, e.g. using `fetchUpdateAsync`. If we set
    // the default selection policy here instead, the update we are launching here would keep being
    // launched by `reloadAsync` even if a newer one is downloaded.
    setNextSelectionPolicy(SelectionPolicy(
      launcherSelectionPolicy: LauncherSelectionPolicySingleUpdate(updateId: update.updateId),
      loaderSelectionPolicy: currentSelectionPolicy.loaderSelectionPolicy,
      reaperSelectionPolicy: currentSelectionPolicy.reaperSelectionPolicy
    ))

    let launcher = AppLauncherWithDatabase(
      config: configuration,
      database: self.database,
      directory: self.updatesDirectory!,
      completionQueue: self.controllerQueue
    )
    launcher.launchUpdate(withSelectionPolicy: self.selectionPolicy()) { error, success in
      if !success {
        // reset controller's configuration to what it was before this request
        self.config = self.previousUpdatesConfiguration!
        errorBlock(error ?? DevLauncherAppControllerError.updateLaunchFailed)
        return
      }

      self.launcher = launcher
      successBlock(launcher.launchedUpdate?.manifest.rawManifestJSON())
      self.runReaper()
    }
  }

  private func runReaper() {
    if let launchedUpdate = launcher?.launchedUpdate,
      let config = self.config,
      let updatesDirectory = updatesDirectory {
      UpdatesReaper.reapUnusedUpdates(
        withConfig: config,
        database: database,
        directory: updatesDirectory,
        selectionPolicy: selectionPolicy(),
        launchedUpdate: launchedUpdate
      )
    }
  }

  public func getConstantsForModule() -> UpdatesModuleConstants {
    return UpdatesModuleConstants(
      launchedUpdate: launcher?.launchedUpdate,
      launchDuration: nil,
      embeddedUpdate: nil, // no embedded update in debug builds
      emergencyLaunchException: self.directoryDatabaseException,
      isEnabled: true,
      isUsingEmbeddedAssets: isUsingEmbeddedAssets(),
      runtimeVersion: self.config?.runtimeVersion ?? "1",
      checkOnLaunch: self.config?.checkOnLaunch ?? CheckAutomaticallyConfig.Always,
      requestHeaders: self.config?.requestHeaders ?? [:],
      assetFilesMap: assetFilesMap(),
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: true,
      initialContext: UpdatesStateContext()
    )
  }

  public func requestRelaunch(success successBlockArg: @escaping () -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    self.updatesExternalInterfaceDelegate.let { it in
      it.updatesExternalInterfaceDidRequestRelaunch(_: self)
    }
  }

  public func checkForUpdate(success successBlockArg: @escaping (CheckForUpdateResult) -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    errorBlockArg(NotAvailableInDevClientException("Updates.checkForUpdateAsync()"))
  }

  public func fetchUpdate(success successBlockArg: @escaping (FetchUpdateResult) -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    errorBlockArg(NotAvailableInDevClientException("Updates.fetchUpdateAsync()"))
  }

  public func getExtraParams(success successBlockArg: @escaping ([String: String]?) -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    errorBlockArg(NotAvailableInDevClientException("Updates.getExtraParamsAsync()"))
  }

  public func setExtraParam(key: String, value: String?, success successBlockArg: @escaping () -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    errorBlockArg(NotAvailableInDevClientException("Updates.setExtraParamAsync()"))
  }
}

// swiftlint:enable force_unwrapping
// swiftlint:enable line_length
