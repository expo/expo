// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXDevMenu
import EXUpdatesInterface

@objc
public class ExpoDevLauncherReactDelegateHandler: ExpoReactDelegateHandler, RCTBridgeDelegate, EXDevLauncherControllerDelegate {
  @objc
  public static var enableAutoSetup: Bool = true

  private weak var reactDelegate: ExpoReactDelegate?
  private var bridgeDelegateHandler: DevClientAppDelegate?
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
    self.bridgeDelegateHandler = EXRCTAppDelegateInterceptor(bridgeDelegate: bridgeDelegate, interceptor: self)

    EXDevLauncherController.sharedInstance().autoSetupPrepare(self, launchOptions: launchOptions)
    if let sharedController = UpdatesControllerRegistry.sharedInstance.controller {
      // for some reason the swift compiler and bridge are having issues here
      EXDevLauncherController.sharedInstance().updatesInterface = sharedController
    }
    return EXDevLauncherDeferredRCTBridge(delegate: self.bridgeDelegateHandler, launchOptions: launchOptions)
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

  // swiftlint:disable implicitly_unwrapped_optional
  public func sourceURL(for bridge: RCTBridge!) -> URL! {
    return EXDevLauncherController.sharedInstance().sourceUrl()
  }
  // swiftlint:enable implicitly_unwrapped_optional

  // MARK: EXDevelopmentClientControllerDelegate implementations

  public func devLauncherController(_ developmentClientController: EXDevLauncherController, didStartWithSuccess success: Bool) {
    guard let bridgeDelegateHandler = self.bridgeDelegateHandler else {
      fatalError("bridgeDelegateHandler is not initialized")
    }
    let bridge = bridgeDelegateHandler.createBridgeAndSetAdapter(launchOptions: developmentClientController.getLaunchOptions())
    developmentClientController.appBridge = bridge

    guard let rootView = bridgeDelegateHandler.createRootView(
      with: bridge,
      // swiftlint:disable:next force_unwrapping
      moduleName: self.rootViewModuleName!,
      initProps: self.rootViewInitialProperties
    ) else {
      return
    }
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white
    let window = getWindow()

    // NOTE: this order of assignment seems to actually have an effect on behaviour
    // direct assignment of window.rootViewController.view = rootView does not work
    guard let rootViewController = self.reactDelegate?.createRootViewController() else {
      fatalError("Invalid rootViewController returned from ExpoReactDelegate")
    }
    rootViewController.view = rootView
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
    guard let window = window else {
      fatalError("Cannot find the current window.")
    }
    return window
  }
}
