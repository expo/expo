//  Copyright © 2021 650 Industries. All rights reserved.

// this class used a bunch of implicit non-null patterns for member variables. not worth refactoring to appease lint.
// swiftlint:disable force_unwrapping

import Foundation
import EXUpdatesInterface

/**
 * Main entry point to expo-updates in development builds with expo-dev-client. Singleton that still
 * makes use of AppController for keeping track of updates state, but provides capabilities
 * that are not usually exposed but that expo-dev-client needs (launching and downloading a specific
 * update by URL, allowing dynamic configuration, introspecting the database).
 *
 * Implements the EXUpdatesExternalInterface from the expo-updates-interface package. This allows
 * expo-dev-client to compile without needing expo-updates to be installed.
 */
@objc(EXUpdatesDevLauncherController)
@objcMembers
public final class DevLauncherController: NSObject, UpdatesExternalInterface {
  private static let ErrorDomain = "EXUpdatesDevLauncherController"

  enum ErrorCode: Int {
    case invalidUpdateURL = 1
    case updateLaunchFailed = 4
    case configFailed = 5
  }

  private var tempConfig: UpdatesConfig?

  private weak var _bridge: AnyObject?
  public weak var bridge: AnyObject? {
    get {
      return _bridge
    }
    set(value) {
      _bridge = value
      if let value = value as? RCTBridge {
        AppController.sharedInstance.bridge = value
      }
    }
  }

  public static let sharedInstance = DevLauncherController()

  override init() {}

  public var launchAssetURL: URL? {
    return AppController.sharedInstance.launchAssetUrl()
  }

  public func reset() {
    let controller = AppController.sharedInstance
    controller.launcher = nil
    controller.isStarted = true
  }

  public func fetchUpdate(
    withConfiguration configuration: [String: Any],
    onManifest manifestBlock: @escaping UpdatesManifestBlock,
    progress progressBlock: @escaping UpdatesProgressBlock,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    guard let updatesConfiguration = setup(configuration: configuration, error: errorBlock) else {
      return
    }

    let controller = AppController.sharedInstance

    // since controller is a singleton, save its config so we can reset to it if our request fails
    tempConfig = controller.config

    setDevelopmentSelectionPolicy()
    controller.setConfigurationInternal(config: updatesConfiguration)

    let loader = RemoteAppLoader(
      config: updatesConfiguration,
      database: controller.database,
      directory: controller.updatesDirectory!,
      launchedUpdate: nil,
      completionQueue: controller.controllerQueue
    )
    loader.loadUpdate(
      fromURL: updatesConfiguration.updateUrl!
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

      return manifestBlock(update.manifest!.rawManifestJSON())
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
      controller.setConfigurationInternal(config: self.tempConfig!)
      errorBlock(error)
    }
  }

  public func storedUpdateIds(
    withConfiguration configuration: [String: Any],
    success successBlock: @escaping UpdatesQuerySuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    guard setup(configuration: configuration, error: errorBlock) != nil else {
      successBlock([])
      return
    }

    AppLauncherWithDatabase.storedUpdateIds(
      inDatabase: AppController.sharedInstance.database
    ) { error, storedUpdateIds in
      if let error = error {
        errorBlock(error)
      } else {
        successBlock(storedUpdateIds!)
      }
    }
  }

  /**
   Common initialization for both fetchUpdateWithConfiguration: and storedUpdateIdsWithConfiguration:
   Sets up EXUpdatesAppController shared instance
   Returns the updatesConfiguration
   */
  private func setup(configuration: [AnyHashable: Any], error errorBlock: UpdatesErrorBlock) -> UpdatesConfig? {
    let controller = AppController.sharedInstance
    var updatesConfiguration: UpdatesConfig
    do {
      updatesConfiguration = try UpdatesConfig.configWithExpoPlist(mergingOtherDictionary: configuration as? [String: Any] ?? [:])
    } catch {
      errorBlock(NSError(
        domain: DevLauncherController.ErrorDomain,
        code: ErrorCode.configFailed.rawValue,
        userInfo: [
          // swiftlint:disable:next line_length
          NSLocalizedDescriptionKey: "Cannot load configuration from Expo.plist. Please ensure you've followed the setup and installation instructions for expo-updates to create Expo.plist and add it to your Xcode project."
        ]
      ))
      return nil
    }

    guard updatesConfiguration.updateUrl != nil && updatesConfiguration.scopeKey != nil else {
      errorBlock(NSError(
        domain: DevLauncherController.ErrorDomain,
        code: ErrorCode.invalidUpdateURL.rawValue,
        userInfo: [
          NSLocalizedDescriptionKey: "Failed to read stored updates: configuration object must include a valid update URL"
        ]
      ))
      return nil
    }

    do {
      try controller.initializeUpdatesDirectory()
      try controller.initializeUpdatesDatabase()
    } catch {
      errorBlock(error)
      return nil
    }

    return updatesConfiguration
  }

  private func setDevelopmentSelectionPolicy() {
    let controller = AppController.sharedInstance
    controller.resetSelectionPolicyToDefault()
    let currentSelectionPolicy = controller.selectionPolicy()
    controller.defaultSelectionPolicy = SelectionPolicy(
      launcherSelectionPolicy: currentSelectionPolicy.launcherSelectionPolicy,
      loaderSelectionPolicy: currentSelectionPolicy.loaderSelectionPolicy,
      reaperSelectionPolicy: ReaperSelectionPolicyDevelopmentClient()
    )
    controller.resetSelectionPolicyToDefault()
  }

  private func launch(
    update: Update,
    withConfiguration configuration: UpdatesConfig,
    success successBlock: @escaping UpdatesUpdateSuccessBlock,
    error errorBlock: @escaping UpdatesErrorBlock
  ) {
    let controller = AppController.sharedInstance
    // ensure that we launch the update we want, even if it isn't the latest one
    let currentSelectionPolicy = controller.selectionPolicy()

    // Calling `setNextSelectionPolicy` allows the Updates module's `reloadAsync` method to reload
    // with a different (newer) update if one is downloaded, e.g. using `fetchUpdateAsync`. If we set
    // the default selection policy here instead, the update we are launching here would keep being
    // launched by `reloadAsync` even if a newer one is downloaded.
    controller.setNextSelectionPolicy(SelectionPolicy(
      launcherSelectionPolicy: LauncherSelectionPolicySingleUpdate(updateId: update.updateId),
      loaderSelectionPolicy: currentSelectionPolicy.loaderSelectionPolicy,
      reaperSelectionPolicy: currentSelectionPolicy.reaperSelectionPolicy
    ))

    let launcher = AppLauncherWithDatabase(
      config: configuration,
      database: controller.database,
      directory: controller.updatesDirectory!,
      completionQueue: controller.controllerQueue
    )
    launcher.launchUpdate(withSelectionPolicy: controller.selectionPolicy()) { error, success in
      if !success {
        // reset controller's configuration to what it was before this request
        controller.setConfigurationInternal(config: self.tempConfig!)
        errorBlock(error ?? NSError(
          domain: DevLauncherController.ErrorDomain,
          code: ErrorCode.updateLaunchFailed.rawValue,
          userInfo: [NSLocalizedDescriptionKey: "Failed to launch update with an unknown error"]
        ))
        return
      }

      controller.isStarted = true
      controller.launcher = launcher
      successBlock(launcher.launchedUpdate?.manifest?.rawManifestJSON())
      controller.runReaper()
    }
  }
}

// swiftlint:enable force_unwrapping
