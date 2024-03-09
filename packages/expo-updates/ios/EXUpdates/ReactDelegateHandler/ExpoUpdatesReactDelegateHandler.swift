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
  private var launchOptions: [AnyHashable: Any]?
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

  public override func createReactHost(reactDelegate: ExpoReactDelegate, launchOptions: [AnyHashable : Any]?) -> ExpoReactHostWrapper? {
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

    // TODO: launch screen should move to expo-splash-screen
    // or assuming expo-splash-screen KVO will make it works even we don't show it explicitly.
    // controller.startAndShowLaunchScreen(UIApplication.shared.delegate!.window!!)
    controller.start()

    self.launchOptions = launchOptions

    return EXDeferredReactHost()
  }

  public override func createRootView(reactDelegate: ExpoReactDelegate, host: ExpoReactHostWrapper, moduleName: String, initialProperties: [AnyHashable : Any]?) -> UIView? {
    if !shouldEnableAutoSetup {
      return nil
    }

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

    let rootViewFactory = ExpoReactRootViewFactory(rctAppDelegate: nil, bundleURL: AppController.sharedInstance.launchAssetUrl())
    let rootView = rootViewFactory.view(withModuleName: nil, initialProperties: self.rootViewInitialProperties, launchOptions: self.launchOptions)
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white
    let window = UIApplication.shared.delegate!.window!!
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
    self.launchOptions = nil
    self.deferredRootView = nil
    self.rootViewModuleName = nil
    self.rootViewInitialProperties = nil
  }
}
