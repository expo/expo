// Copyright 2018-present 650 Industries. All rights reserved.

import ABI45_0_0ExpoModulesCore

public class ExpoUpdatesReactDelegateHandler: ExpoReactDelegateHandler, ABI45_0_0EXUpdatesAppControllerDelegate, ABI45_0_0RCTBridgeDelegate {
  private weak var reactDelegate: ExpoReactDelegate?
  private var bridgeDelegate: ABI45_0_0RCTBridgeDelegate?
  private var launchOptions: [AnyHashable: Any]?
  private var deferredRootView: ABI45_0_0EXDeferredRCTRootView?
  private var rootViewModuleName: String?
  private var rootViewInitialProperties: [AnyHashable: Any]?
  private lazy var shouldEnableAutoSetup: Bool = {
    if ABI45_0_0EXAppDefines.APP_DEBUG {
      return false
    }
    // if Expo.plist not found or its content is invalid, disable the auto setup
    guard
      let configPath = Bundle.main.path(forResource: ABI45_0_0EXUpdatesConfigPlistName, ofType: "plist"),
      let config = NSDictionary(contentsOfFile: configPath)
    else {
      return false
    }

    // if `ABI45_0_0EXUpdatesAutoSetup` is false, disable the auto setup
    let enableAutoSetupValue = config[ABI45_0_0EXUpdatesConfigEnableAutoSetupKey]
    if let enableAutoSetup = enableAutoSetupValue as? NSNumber, enableAutoSetup.boolValue == false {
      return false
    }

    // Backward compatible if main AppDelegate already has expo-updates setup,
    // we just skip in this case.
    if ABI45_0_0EXUpdatesAppController.sharedInstance().isStarted {
      return false
    }

    return true
  }()

  public override func createBridge(reactDelegate: ExpoReactDelegate, bridgeDelegate: ABI45_0_0RCTBridgeDelegate, launchOptions: [AnyHashable: Any]?) -> ABI45_0_0RCTBridge? {
    if !shouldEnableAutoSetup {
      return nil
    }

    self.reactDelegate = reactDelegate
    let controller = ABI45_0_0EXUpdatesAppController.sharedInstance()
    controller.delegate = self

    // TODO: launch screen should move to expo-splash-screen
    // or assuming expo-splash-screen KVO will make it works even we don't show it explicitly.
    // controller.startAndShowLaunchScreen(UIApplication.shared.delegate!.window!!)
    controller.start()

    self.bridgeDelegate = ABI45_0_0EXRCTBridgeDelegateInterceptor(bridgeDelegate: bridgeDelegate, interceptor: self)
    self.launchOptions = launchOptions

    return ABI45_0_0EXDeferredRCTBridge(delegate: self.bridgeDelegate!, launchOptions: self.launchOptions)
  }

  public override func createRootView(reactDelegate: ExpoReactDelegate, bridge: ABI45_0_0RCTBridge, moduleName: String, initialProperties: [AnyHashable: Any]?) -> ABI45_0_0RCTRootView? {
    if !shouldEnableAutoSetup {
      return nil
    }

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = ABI45_0_0EXDeferredRCTRootView(bridge: bridge, moduleName: moduleName, initialProperties: initialProperties)
    return self.deferredRootView
  }

  // MARK: ABI45_0_0EXUpdatesAppControllerDelegate implementations

  public func appController(_ appController: ABI45_0_0EXUpdatesAppController, didStartWithSuccess success: Bool) {
    guard let reactDelegate = self.reactDelegate else {
      fatalError("`reactDelegate` should not be nil")
    }

    let bridge = ABI45_0_0RCTBridge(delegate: self.bridgeDelegate, launchOptions: self.launchOptions)
    appController.bridge = bridge

    let rootView = ABI45_0_0RCTRootView(bridge: bridge!, moduleName: self.rootViewModuleName!, initialProperties: self.rootViewInitialProperties)
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white
    let window = UIApplication.shared.delegate!.window!!
    let rootViewController = reactDelegate.createRootViewController()
    rootViewController.view = rootView
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()

    self.cleanup()
  }

  // MARK: ABI45_0_0RCTBridgeDelegate implementations

  public func sourceURL(for bridge: ABI45_0_0RCTBridge!) -> URL! {
    return ABI45_0_0EXUpdatesAppController.sharedInstance().launchAssetUrl
  }

  // MARK: Internals

  /**
   Cleanup unused resources after `ABI45_0_0RCTBridge` created.
   We should keep `bridgeDelegate` alive because it's a wrapper of `ABI45_0_0RCTBridgeDelegate` from `AppDelegate` and somehow bridge may access it after.
   */
  private func cleanup() {
    self.reactDelegate = nil
    self.launchOptions = nil
    self.deferredRootView = nil
    self.rootViewModuleName = nil
    self.rootViewInitialProperties = nil
  }
}
