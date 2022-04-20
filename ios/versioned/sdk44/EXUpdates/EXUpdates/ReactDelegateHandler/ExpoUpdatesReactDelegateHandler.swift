// Copyright 2018-present 650 Industries. All rights reserved.

import ABI44_0_0ExpoModulesCore

public class ExpoUpdatesReactDelegateHandler: ExpoReactDelegateHandler, ABI44_0_0EXUpdatesAppControllerDelegate, ABI44_0_0RCTBridgeDelegate {
  private weak var reactDelegate: ExpoReactDelegate?
  private var bridgeDelegate: ABI44_0_0RCTBridgeDelegate?
  private var launchOptions: [AnyHashable: Any]?
  private var deferredRootView: ABI44_0_0EXDeferredRCTRootView?
  private var rootViewModuleName: String?
  private var rootViewInitialProperties: [AnyHashable: Any]?
  private lazy var shouldEnableAutoSetup: Bool = {
    if ABI44_0_0EXAppDefines.APP_DEBUG {
      return false
    }
    // if Expo.plist not found or its content is invalid, disable the auto setup
    guard
      let configPath = Bundle.main.path(forResource: ABI44_0_0EXUpdatesConfigPlistName, ofType: "plist"),
      let config = NSDictionary(contentsOfFile: configPath)
    else {
      return false
    }

    // if `ABI44_0_0EXUpdatesAutoSetup` is false, disable the auto setup
    let enableAutoSetupValue = config[ABI44_0_0EXUpdatesConfigEnableAutoSetupKey]
    if let enableAutoSetup = enableAutoSetupValue as? NSNumber, enableAutoSetup.boolValue == false {
      return false
    }

    // Backward compatible if main AppDelegate already has expo-updates setup,
    // we just skip in this case.
    if ABI44_0_0EXUpdatesAppController.sharedInstance().isStarted {
      return false
    }

    return true
  }()

  public override func createBridge(reactDelegate: ExpoReactDelegate, bridgeDelegate: ABI44_0_0RCTBridgeDelegate, launchOptions: [AnyHashable: Any]?) -> ABI44_0_0RCTBridge? {
    if !shouldEnableAutoSetup {
      return nil
    }

    self.reactDelegate = reactDelegate
    let controller = ABI44_0_0EXUpdatesAppController.sharedInstance()
    controller.delegate = self

    // TODO: launch screen should move to expo-splash-screen
    // or assuming expo-splash-screen KVO will make it works even we don't show it explicitly.
    // controller.startAndShowLaunchScreen(UIApplication.shared.delegate!.window!!)
    controller.start()

    self.bridgeDelegate = ABI44_0_0EXRCTBridgeDelegateInterceptor(bridgeDelegate: bridgeDelegate, interceptor: self)
    self.launchOptions = launchOptions

    return ABI44_0_0EXDeferredRCTBridge(delegate: self.bridgeDelegate!, launchOptions: self.launchOptions)
  }

  public override func createRootView(reactDelegate: ExpoReactDelegate, bridge: ABI44_0_0RCTBridge, moduleName: String, initialProperties: [AnyHashable: Any]?) -> ABI44_0_0RCTRootView? {
    if !shouldEnableAutoSetup {
      return nil
    }

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = ABI44_0_0EXDeferredRCTRootView(bridge: bridge, moduleName: moduleName, initialProperties: initialProperties)
    return self.deferredRootView
  }

  // MARK: ABI44_0_0EXUpdatesAppControllerDelegate implementations

  public func appController(_ appController: ABI44_0_0EXUpdatesAppController, didStartWithSuccess success: Bool) {
    guard let reactDelegate = self.reactDelegate else {
      fatalError("`reactDelegate` should not be nil")
    }

    let bridge = ABI44_0_0RCTBridge(delegate: self.bridgeDelegate, launchOptions: self.launchOptions)
    appController.bridge = bridge

    let rootView = ABI44_0_0RCTRootView(bridge: bridge!, moduleName: self.rootViewModuleName!, initialProperties: self.rootViewInitialProperties)
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white
    let window = UIApplication.shared.delegate!.window!!
    let rootViewController = reactDelegate.createRootViewController()
    rootViewController.view = rootView
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()

    self.cleanup()
  }

  // MARK: ABI44_0_0RCTBridgeDelegate implementations

  public func sourceURL(for bridge: ABI44_0_0RCTBridge!) -> URL! {
    return ABI44_0_0EXUpdatesAppController.sharedInstance().launchAssetUrl
  }

  // MARK: Internals

  /**
   Cleanup unused resources after `ABI44_0_0RCTBridge` created.
   We should keep `bridgeDelegate` alive because it's a wrapper of `ABI44_0_0RCTBridgeDelegate` from `AppDelegate` and somehow bridge may access it after.
   */
  private func cleanup() {
    self.reactDelegate = nil
    self.launchOptions = nil
    self.deferredRootView = nil
    self.rootViewModuleName = nil
    self.rootViewInitialProperties = nil
  }
}
