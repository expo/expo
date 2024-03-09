// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXDevMenu
import EXUpdatesInterface

@objc
public class ExpoDevLauncherReactDelegateHandler: ExpoReactDelegateHandler, EXDevLauncherControllerDelegate {
  @objc
  public static var enableAutoSetup: Bool = true

  private weak var reactDelegate: ExpoReactDelegate?
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

  public override func createReactHost(reactDelegate: ExpoReactDelegate, launchOptions: [AnyHashable : Any]?) -> ExpoReactHostWrapper? {
    if !ExpoDevLauncherReactDelegateHandler.shouldEnableAutoSetup {
      return nil
    }

    // DevLauncherController will handle dev menu configuration, so dev menu auto-setup is not needed
    ExpoDevMenuReactDelegateHandler.enableAutoSetup = false

    self.reactDelegate = reactDelegate

    EXDevLauncherController.sharedInstance().autoSetupPrepare(self, launchOptions: launchOptions)
    if let sharedController = UpdatesControllerRegistry.sharedInstance.controller {
      // for some reason the swift compiler and bridge are having issues here
      EXDevLauncherController.sharedInstance().updatesInterface = sharedController
      sharedController.updatesExternalInterfaceDelegate = EXDevLauncherController.sharedInstance()
    }
    return EXDevLauncherDeferredReactHost()
  }

  public override func createRootView(reactDelegate: ExpoReactDelegate, host: ExpoReactHostWrapper, moduleName: String, initialProperties: [AnyHashable : Any]?) -> UIView? {
    if !ExpoDevLauncherReactDelegateHandler.shouldEnableAutoSetup {
      return nil
    }

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = EXDevLauncherDeferredRCTRootView()
    return self.deferredRootView
  }

  // MARK: EXDevelopmentClientControllerDelegate implementations

  public func devLauncherController(_ developmentClientController: EXDevLauncherController, didStartWithSuccess success: Bool) {
    developmentClientController.appBridge = RCTBridge.current()

    let rootViewFactory = ExpoReactRootViewFactory(rctAppDelegate: nil, bundleURL: EXDevLauncherController.sharedInstance().sourceUrl())
    let rootView = rootViewFactory.view(withModuleName: nil, initialProperties: self.rootViewInitialProperties, launchOptions: developmentClientController.getLaunchOptions())
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
