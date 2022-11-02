// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXDevMenu
import EXUpdatesInterface

@objc
public class ExpoDevLauncherReactDelegateHandler: ExpoReactDelegateHandler, RCTBridgeDelegate, EXDevLauncherControllerDelegate {
  @objc
  public static var enableAutoSetup: Bool = true

  private weak var reactDelegate: ExpoReactDelegate?
  private var bridgeDelegate: RCTBridgeDelegate?
  private var launchOptions: [AnyHashable : Any]?
  private var deferredRootView: EXDevLauncherDeferredRCTRootView?
  private var rootViewModuleName: String?
  private var rootViewInitialProperties: [AnyHashable : Any]?
  static var shouldEnableAutoSetup: Bool = {
    // if someone else has set this explicitly, use that value
    if !enableAutoSetup {
      return false
    }

    if !EXAppDefines.APP_DEBUG {
      return false
    }

    // Backwards compatibility -- if the main AppDelegate has already set up expo-dev-launcher,
    // we just skip in this case.
    if EXDevLauncherController.sharedInstance().isStarted {
      return false
    }

    return true
  }()

  public override func createBridge(reactDelegate: ExpoReactDelegate, bridgeDelegate: RCTBridgeDelegate, launchOptions: [AnyHashable : Any]?) -> RCTBridge? {
    if !ExpoDevLauncherReactDelegateHandler.shouldEnableAutoSetup {
      return nil
    }

    // DevLauncherController will handle dev menu configuration, so dev menu auto-setup is not needed
    ExpoDevMenuReactDelegateHandler.enableAutoSetup = false

    self.reactDelegate = reactDelegate
    self.bridgeDelegate = EXRCTBridgeDelegateInterceptor(bridgeDelegate: bridgeDelegate, interceptor: self)
    self.launchOptions = launchOptions

    EXDevLauncherController.sharedInstance().autoSetupPrepare(self, launchOptions: launchOptions)
    if (EXUpdatesControllerRegistry.sharedInstance().controller != nil) {
      EXDevLauncherController.sharedInstance().updatesInterface = EXUpdatesControllerRegistry.sharedInstance().controller
    }
    return EXDevLauncherDeferredRCTBridge(delegate: self.bridgeDelegate!, launchOptions: self.launchOptions)
  }

  public override func createRootView(reactDelegate: ExpoReactDelegate, bridge: RCTBridge, moduleName: String, initialProperties: [AnyHashable : Any]?) -> RCTRootView? {
    if !ExpoDevLauncherReactDelegateHandler.shouldEnableAutoSetup {
      return nil
    }

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = EXDevLauncherDeferredRCTRootView(bridge: bridge, moduleName: moduleName, initialProperties: initialProperties)
    return self.deferredRootView
  }

  // MARK: RCTBridgeDelegate implementations

  public func sourceURL(for bridge: RCTBridge!) -> URL! {
    return EXDevLauncherController.sharedInstance().sourceUrl()
  }

  // MARK: EXDevelopmentClientControllerDelegate implementations

  public func devLauncherController(_ developmentClientController: EXDevLauncherController, didStartWithSuccess success: Bool) {
    var launchOptions: [AnyHashable: Any] = [:]

    if let initialLaunchOptions = self.launchOptions {
      for (key, value) in initialLaunchOptions {
        launchOptions[key] = value
      }
    }

    for (key, value) in developmentClientController.getLaunchOptions() {
      launchOptions[key] = value
    }

    let bridge = RCTBridge(delegate: self.bridgeDelegate, launchOptions: launchOptions)
    developmentClientController.appBridge = bridge

    let rootView = RCTRootView(bridge: bridge!, moduleName: self.rootViewModuleName!, initialProperties: self.rootViewInitialProperties)
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white
    let window = getWindow()

    // NOTE: this order of assignment seems to actually have an effect on behaviour
    // direct assignment of window.rootViewController.view = rootView does not work
    let rootViewController = self.reactDelegate?.createRootViewController()
    rootViewController!.view = rootView
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()

    // it is purposeful that we don't clean up saved properties here, because we may initialize
    // several React instances over a single app lifetime and we want them all to have the same
    // initial properties
  }

  // MARK: Internals

  private func getWindow() -> UIWindow {
    var window = UIApplication.shared.windows.filter {$0.isKeyWindow}.first
    if (window == nil) {
      window = UIApplication.shared.delegate?.window ?? nil
    }
    if (window == nil) {
      fatalError("Cannot find the current window.")
    }
    return window!
  }
}
