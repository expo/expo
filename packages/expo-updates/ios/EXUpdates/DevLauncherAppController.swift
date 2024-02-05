//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable line_length
// swiftlint:disable force_unwrapping

import EXUpdatesInterface
import ExpoModulesCore

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
  public weak var bridge: AnyObject?

  public weak var delegate: AppControllerDelegate?
  public weak var updatesExternalInterfaceDelegate: (any EXUpdatesInterface.UpdatesExternalInterfaceDelegate)?

  public func launchAssetUrl() -> URL? {
    return launcher?.launchAssetUrl
  }

  private let isEmergencyLaunch: Bool
  public var launchAssetURL: URL? {
    launcher?.launchAssetUrl
  }

  // swiftlint:disable unavailable_function
  public func start() {
    preconditionFailure("Cannot call start on DevLauncherAppController")
  }
  // swiftlint:enable unavailable_function

  private static let ErrorDomain = "EXUpdatesDevLauncherController"

  enum ErrorCode: Int {
    case invalidUpdateURL = 1
    case updateLaunchFailed = 4
    case configFailed = 5
  }

  private var previousUpdatesConfiguration: UpdatesConfig?
  private var config: UpdatesConfig?
  private let isMissingRuntimeVersion: Bool

  private var directoryDatabaseException: Error?
  public let updatesDirectory: URL? // internal for E2E test
  private let database: UpdatesDatabase

  private var launcher: AppLauncher?
  private let controllerQueue = DispatchQueue(label: "expo.controller.ControllerQueue")
  public private(set) var isStarted: Bool = false

  private var _selectionPolicy: SelectionPolicy?
  private var defaultSelectionPolicy: SelectionPolicy

  required init(
    initialUpdatesConfiguration: UpdatesConfig?,
    updatesDirectory: URL?,
    updatesDatabase: UpdatesDatabase,
    directoryDatabaseException: Error?,
    isMissingRuntimeVersion: Bool
  ) {
    self.config = initialUpdatesConfiguration
    self.updatesDirectory = updatesDirectory
    self.database = updatesDatabase
    self.directoryDatabaseException = directoryDatabaseException
    self.isEmergencyLaunch = directoryDatabaseException != nil
    self.isMissingRuntimeVersion = isMissingRuntimeVersion

    self.defaultSelectionPolicy = SelectionPolicyFactory.filterAwarePolicy(
      withRuntimeVersion: initialUpdatesConfiguration.let { it in it.runtimeVersionRealized } ?? "1"
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

  public func reset() {
    self.launcher = nil
    self.isStarted = true
  }

  public func fetchUpdate(
    withConfiguration configuration: [String: Any],
    onManifest manifestBlock: @escaping UpdatesManifestBlock,
    progress progressBlock: @escaping UpdatesProgressBlock,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    if let directoryDatabaseException = directoryDatabaseException {
      errorBlock(directoryDatabaseException)
      return
    }

    // swiftlint:disable:next identifier_name
    let updatesConfigurationValidationResult = UpdatesConfig.getUpdatesConfigurationValidationResult(mergingOtherDictionary: configuration)
    switch updatesConfigurationValidationResult {
    case .Valid:
      break
    case .InvalidNotEnabled:
      errorBlock(NSError(
        domain: DevLauncherAppController.ErrorDomain,
        code: ErrorCode.invalidUpdateURL.rawValue,
        userInfo: [
          NSLocalizedDescriptionKey: "Failed to read stored updates: configuration object is not enabled"
        ]
      ))
      return
    case .InvalidPlistError:
      errorBlock(NSError(
        domain: DevLauncherAppController.ErrorDomain,
        code: ErrorCode.invalidUpdateURL.rawValue,
        userInfo: [
          NSLocalizedDescriptionKey: "Failed to read stored updates: invalid Expo.plist"
        ]
      ))
      return
    case .InvalidMissingURL:
      errorBlock(NSError(
        domain: DevLauncherAppController.ErrorDomain,
        code: ErrorCode.invalidUpdateURL.rawValue,
        userInfo: [
          NSLocalizedDescriptionKey: "Failed to read stored updates: configuration object must include a valid update URL"
        ]
      ))
      return
    case .InvalidMissingRuntimeVersion:
      errorBlock(NSError(
        domain: DevLauncherAppController.ErrorDomain,
        code: ErrorCode.invalidUpdateURL.rawValue,
        userInfo: [
          NSLocalizedDescriptionKey: "Failed to read stored updates: configuration object must include a valid runtime version"
        ]
      ))
      return
    }

    var updatesConfiguration: UpdatesConfig
    do {
      updatesConfiguration = try UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: configuration)
    } catch {
      errorBlock(NSError(
        domain: DevLauncherAppController.ErrorDomain,
        code: ErrorCode.configFailed.rawValue,
        userInfo: [
          NSLocalizedDescriptionKey: "Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
        ]
      ))
      return
    }

    // since controller is a singleton, save its config so we can reset to it if our request fails
    self.previousUpdatesConfiguration = self.config

    setDevelopmentSelectionPolicy()
    self.config = updatesConfiguration

    let loader = RemoteAppLoader(
      config: updatesConfiguration,
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
        errorBlock(error ?? NSError(
          domain: DevLauncherAppController.ErrorDomain,
          code: ErrorCode.updateLaunchFailed.rawValue,
          userInfo: [NSLocalizedDescriptionKey: "Failed to launch update with an unknown error"]
        ))
        return
      }

      self.isStarted = true
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
      embeddedUpdate: nil, // no embedded update in debug builds
      isEmergencyLaunch: isEmergencyLaunch,
      isEnabled: true,
      releaseChannel: self.config?.releaseChannel ?? "default",
      isUsingEmbeddedAssets: isUsingEmbeddedAssets(),
      runtimeVersion: self.config?.runtimeVersionRaw ?? "1",
      checkOnLaunch: self.config?.checkOnLaunch ?? CheckAutomaticallyConfig.Always,
      requestHeaders: self.config?.requestHeaders ?? [:],
      assetFilesMap: assetFilesMap(),
      isMissingRuntimeVersion: self.isMissingRuntimeVersion,
      shouldDeferToNativeForAPIMethodAvailabilityInDevelopment: true
    )
  }

  public func requestRelaunch(success successBlockArg: @escaping () -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    self.updatesExternalInterfaceDelegate.let { it in
      it.updatesExternalInterfaceDidRequestRelaunch(_: self)
    }
  }

  public func checkForUpdate(success successBlockArg: @escaping (CheckForUpdateResult) -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    errorBlockArg(NotAvailableInDevClientException())
  }

  public func fetchUpdate(success successBlockArg: @escaping (FetchUpdateResult) -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    errorBlockArg(NotAvailableInDevClientException())
  }

  public func getExtraParams(success successBlockArg: @escaping ([String: String]?) -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    errorBlockArg(NotAvailableInDevClientException())
  }

  public func setExtraParam(key: String, value: String?, success successBlockArg: @escaping () -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    errorBlockArg(NotAvailableInDevClientException())
  }

  public func getNativeStateMachineContext(success successBlockArg: @escaping (UpdatesStateContext) -> Void, error errorBlockArg: @escaping (ExpoModulesCore.Exception) -> Void) {
    successBlockArg(UpdatesStateContext())
  }
}

// swiftlint:enable force_unwrapping
// swiftlint:enable line_length
