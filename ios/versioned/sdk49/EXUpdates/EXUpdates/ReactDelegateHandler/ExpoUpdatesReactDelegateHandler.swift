// Copyright 2018-present 650 Industries. All rights reserved.

import ABI49_0_0ExpoModulesCore

/**
 * Manages and controls the auto-setup behavior of expo-updates in applicable environments.
 *
 * In order to deal with the asynchronous nature of updates startup, this class creates dummy
 * ABI49_0_0RCTBridge and ABI49_0_0RCTRootView objects to return to the ABI49_0_0ReactDelegate, replacing them with the real
 * objects when expo-updates is ready.
 */
public final class ExpoUpdatesReactDelegateHandler: ExpoReactDelegateHandler, AppControllerDelegate, ABI49_0_0RCTBridgeDelegate {
  private weak var reactDelegate: ExpoReactDelegate?
  private var bridgeDelegate: ABI49_0_0RCTBridgeDelegate?
  private var launchOptions: [AnyHashable: Any]?
  private var deferredRootView: ABI49_0_0EXDeferredRCTRootView?
  private var rootViewModuleName: String?
  private var rootViewInitialProperties: [AnyHashable: Any]?
  private lazy var shouldEnableAutoSetup: Bool = {
    if ABI49_0_0EXAppDefines.APP_DEBUG && !UpdatesUtils.isNativeDebuggingEnabled() {
      return false
    }
    // if Expo.plist not found or its content is invalid, disable the auto setup
    guard
      let configPath = Bundle.main.path(forResource: UpdatesConfig.PlistName, ofType: "plist"),
      let config = NSDictionary(contentsOfFile: configPath)
    else {
      return false
    }

    // if `ABI49_0_0EXUpdatesAutoSetup` is false, disable the auto setup
    let enableAutoSetupValue = config[UpdatesConfig.ABI49_0_0EXUpdatesConfigEnableAutoSetupKey]
    if let enableAutoSetup = enableAutoSetupValue as? NSNumber, enableAutoSetup.boolValue == false {
      return false
    }

    // Backward compatible if main AppDelegate already has expo-updates setup,
    // we just skip in this case.
    if AppController.sharedInstance.isStarted {
      return false
    }

    return true
  }()

  public override func createBridge(reactDelegate: ExpoReactDelegate, bridgeDelegate: ABI49_0_0RCTBridgeDelegate, launchOptions: [AnyHashable: Any]?) -> ABI49_0_0RCTBridge? {
    if !shouldEnableAutoSetup {
      return nil
    }

    self.reactDelegate = reactDelegate
    let controller = AppController.sharedInstance
    controller.delegate = self

    // TODO: launch screen should move to expo-splash-screen
    // or assuming expo-splash-screen KVO will make it works even we don't show it explicitly.
    // controller.startAndShowLaunchScreen(UIApplication.shared.delegate!.window!!)
    controller.start()

    self.bridgeDelegate = ABI49_0_0EXRCTBridgeDelegateInterceptor(bridgeDelegate: bridgeDelegate, interceptor: self)
    self.launchOptions = launchOptions

    return ABI49_0_0EXDeferredRCTBridge(delegate: self.bridgeDelegate!, launchOptions: self.launchOptions)
  }

  public override func createRootView(reactDelegate: ExpoReactDelegate, bridge: ABI49_0_0RCTBridge, moduleName: String, initialProperties: [AnyHashable: Any]?) -> ABI49_0_0RCTRootView? {
    if !shouldEnableAutoSetup {
      return nil
    }

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = ABI49_0_0EXDeferredRCTRootView(bridge: bridge, moduleName: moduleName, initialProperties: initialProperties)
    return self.deferredRootView
  }

  // MARK: AppControllerDelegate implementations

  public func appController(_ appController: AppController, didStartWithSuccess success: Bool) {
    guard let reactDelegate = self.reactDelegate else {
      fatalError("`reactDelegate` should not be nil")
    }

    let bridge = ABI49_0_0RCTBridge(delegate: self.bridgeDelegate, launchOptions: self.launchOptions)
    appController.bridge = bridge

    let rootView = ABI49_0_0RCTRootView(bridge: bridge!, moduleName: self.rootViewModuleName!, initialProperties: self.rootViewInitialProperties)
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white
    let window = UIApplication.shared.delegate!.window!!
    let rootViewController = reactDelegate.createRootViewController()
    rootViewController.view = rootView
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()

    self.cleanup()
  }

  // MARK: ABI49_0_0RCTBridgeDelegate implementations

  public func sourceURL(for bridge: ABI49_0_0RCTBridge!) -> URL! {
    return AppController.sharedInstance.launchAssetUrl()
  }

  // MARK: Internals

  /**
   Cleanup unused resources after `ABI49_0_0RCTBridge` created.
   We should keep `bridgeDelegate` alive because it's a wrapper of `ABI49_0_0RCTBridgeDelegate` from `AppDelegate` and somehow bridge may access it after.
   */
  private func cleanup() {
    self.reactDelegate = nil
    self.launchOptions = nil
    self.deferredRootView = nil
    self.rootViewModuleName = nil
    self.rootViewInitialProperties = nil
  }
}
