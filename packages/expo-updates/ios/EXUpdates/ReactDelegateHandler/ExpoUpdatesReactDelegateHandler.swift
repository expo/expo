// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXUpdatesInterface

/**
 * Manages and controls the auto-setup behavior of expo-updates in applicable environments.
 *
 * In order to deal with the asynchronous nature of updates startup, this class creates dummy
 * RCTBridge and RCTRootView objects to return to the ReactDelegate, replacing them with the real
 * objects when expo-updates is ready.
 */
public final class ExpoUpdatesReactDelegateHandler: ExpoReactDelegateHandler, AppControllerDelegate {
  private weak var reactDelegate: ExpoReactDelegate?
  private var deferredRootView: EXDeferredRCTRootView?
  private var rootViewModuleName: String?
  private var rootViewInitialProperties: [AnyHashable: Any]?
  private lazy var shouldEnableAutoSetup: Bool = {
    if EXAppDefines.APP_DEBUG && !UpdatesUtils.isNativeDebuggingEnabled() {
      return false
    }
    // if Expo.plist not found or its content is invalid, disable the auto setup
    guard
      let configPath = Bundle.main.path(forResource: UpdatesConfig.PlistName, ofType: "plist"),
      let config = NSDictionary(contentsOfFile: configPath)
    else {
      return false
    }

    // if `EXUpdatesAutoSetup` is false, disable the auto setup
    let enableAutoSetupValue = config[UpdatesConfig.EXUpdatesConfigEnableAutoSetupKey]
    if let enableAutoSetup = enableAutoSetupValue as? NSNumber, enableAutoSetup.boolValue == false {
      return false
    }

    // Backward compatible if main AppDelegate already has expo-updates setup,
    // we just skip in this case.
    if AppController.isInitialized() {
      return false
    }

    return true
  }()

  public override func createReactRootView(
    reactDelegate: ExpoReactDelegate,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView? {
    if EXAppDefines.APP_DEBUG && !UpdatesUtils.isNativeDebuggingEnabled() {
      // In development builds with expo-dev-client, completes the auto-setup for development
      // builds with the expo-updates integration by passing a reference to DevLauncherController
      // over to the registry, which expo-dev-client can access.
      UpdatesControllerRegistry.sharedInstance.controller = AppController.initializeAsDevLauncherWithoutStarting()
      return nil
    }
    if !shouldEnableAutoSetup {
      return nil
    }

    self.reactDelegate = reactDelegate
    AppController.initializeWithoutStarting()
    let controller = AppController.sharedInstance
    controller.delegate = self
    controller.start()

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = EXDeferredRCTRootView()
    return self.deferredRootView
  }

  // MARK: AppControllerDelegate implementations

  public func appController(_ appController: AppControllerInterface, didStartWithSuccess success: Bool) {
    guard let reactDelegate = self.reactDelegate else {
      fatalError("`reactDelegate` should not be nil")
    }

    let rootView = ExpoReactRootViewFactory.createDefaultReactRootView(
      AppController.sharedInstance.launchAssetUrl(),
      moduleName: self.rootViewModuleName,
      initialProperties: self.rootViewInitialProperties)
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white
    let window = getWindow()
    let rootViewController = reactDelegate.createRootViewController()
    rootViewController.view = rootView
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()

    self.cleanup()
  }

  // MARK: Internals

  /**
   Cleanup unused resources after react instance created.
   */
  private func cleanup() {
    self.reactDelegate = nil
    self.deferredRootView = nil
    self.rootViewModuleName = nil
    self.rootViewInitialProperties = nil
  }

  private func getWindow() -> UIWindow {
    var window = UIApplication.shared.windows.filter {
      $0.isKeyWindow
    }.first
    if window == nil, let mainWindow = UIApplication.shared.delegate?.window {
      window = mainWindow
    }
    guard let window = window else {
      fatalError("Cannot find the current window.")
    }
    return window
  }
}
