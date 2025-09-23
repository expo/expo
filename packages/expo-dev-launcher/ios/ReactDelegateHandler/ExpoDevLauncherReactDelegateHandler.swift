// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXUpdatesInterface

@objc
public class ExpoDevLauncherReactDelegateHandler: ExpoReactDelegateHandler, EXDevLauncherControllerDelegate {
  private weak var reactNativeFactory: RCTReactNativeFactory?
  private weak var reactDelegate: ExpoReactDelegate?
  private var launchOptions: [AnyHashable: Any]?
  private var deferredRootView: EXDevLauncherDeferredRCTRootView?
  private var rootViewModuleName: String?
  private var rootViewInitialProperties: [AnyHashable: Any]?

  public override func createReactRootView(
    reactDelegate: ExpoReactDelegate,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView? {
    if !EXAppDefines.APP_DEBUG {
      return nil
    }

    self.reactDelegate = reactDelegate
    self.launchOptions = launchOptions
    EXDevLauncherController.sharedInstance().autoSetupPrepare(self, launchOptions: launchOptions)
    if let sharedController = UpdatesControllerRegistry.sharedInstance.controller {
      // for some reason the swift compiler and bridge are having issues here
      EXDevLauncherController.sharedInstance().updatesInterface = sharedController
      sharedController.updatesExternalInterfaceDelegate = EXDevLauncherController.sharedInstance()
    }

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = EXDevLauncherDeferredRCTRootView()
    return self.deferredRootView
  }

  @objc
  public func isReactInstanceValid() -> Bool {
    return self.reactNativeFactory?.rootViewFactory.value(forKey: "reactHost") != nil
  }

  @objc
  public func destroyReactInstance() {
    self.reactNativeFactory?.rootViewFactory.setValue(nil, forKey: "reactHost")
  }

  // MARK: EXDevelopmentClientControllerDelegate implementations

  public func devLauncherController(_ developmentClientController: EXDevLauncherController, didStartWithSuccess success: Bool) {
    let appDelegate = (UIApplication.shared.delegate as? (any ReactNativeFactoryProvider)) ??
    (UIApplication.shared.delegate?.responds(to: Selector(("_expoAppDelegate"))) ?? false ?
    ((UIApplication.shared.delegate as? NSObject)?.value(forKey: "_expoAppDelegate") as? (any ReactNativeFactoryProvider)) : nil)
    let reactDelegate = self.reactDelegate

    guard let reactNativeFactory = appDelegate?.factory as? RCTReactNativeFactory ?? reactDelegate?.reactNativeFactory as? RCTReactNativeFactory else {
      fatalError("`UIApplication.shared.delegate` must be an `ExpoAppDelegate` or `EXAppDelegateWrapper`")
    }
    self.reactNativeFactory = reactNativeFactory

    // Reset rctAppDelegate so we can relaunch the app
    if RCTIsNewArchEnabled() {
      self.reactNativeFactory?.rootViewFactory.setValue(nil, forKey: "_reactHost")
    } else {
      self.reactNativeFactory?.bridge = nil
      self.reactNativeFactory?.rootViewFactory.bridge = nil
    }

    func recreateRootView(
      withBundleURL: URL?,
      moduleName: String?,
      initialProps: [AnyHashable: Any]?,
      launchOptions: [AnyHashable: Any]?
    ) -> UIView {
      if let appDelegate = appDelegate {
        return appDelegate.recreateRootView(
          withBundleURL: withBundleURL,
          moduleName: moduleName,
          initialProps: initialProps,
          launchOptions: launchOptions
        )
      }
      if let factory = reactDelegate?.reactNativeFactory {
        return factory.recreateRootView(
          withBundleURL: withBundleURL,
          moduleName: moduleName,
          initialProps: initialProps,
          launchOptions: launchOptions
        )
      }

      fatalError("`UIApplication.shared.delegate` must be an `ExpoAppDelegate` or `EXAppDelegateWrapper`")
    }

    let rootView = recreateRootView(
      withBundleURL: developmentClientController.sourceUrl(),
      moduleName: self.rootViewModuleName,
      initialProps: self.rootViewInitialProperties,
      launchOptions: developmentClientController.getLaunchOptions()
    )
    developmentClientController.appBridge = RCTBridge.current()
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
    guard let window = UIApplication.shared.windows.filter(\.isKeyWindow).first ?? UIApplication.shared.delegate?.window as? UIWindow else {
      fatalError("Cannot find the current window.")
    }
    return window
  }
}
