// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXUpdatesInterface
import React

private class DevLauncherWrapperView: UIView {
  weak var devLauncherViewController: UIViewController?

  func setupDevLauncherView(_ viewController: UIViewController) {
#if os(macOS)
    viewController.view.autoresizingMask = [.width, .height]
#else
    viewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
#endif
    viewController.view.frame = bounds
  }

#if !os(macOS)
  override func layoutSubviews() {
    super.layoutSubviews()
    devLauncherViewController?.view.frame = bounds
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    devLauncherViewController?.view.layoutIfNeeded()
  }
#endif
}

@objc
public class ExpoDevLauncherReactDelegateHandler: ExpoReactDelegateHandler, EXDevLauncherControllerDelegate {
  private weak var reactNativeFactory: RCTReactNativeFactory?
  private weak var reactDelegate: ExpoReactDelegate?
  private var launchOptions: [AnyHashable: Any]?
  private var rootViewModuleName: String?
  private var rootViewInitialProperties: [AnyHashable: Any]?
  private weak var rootViewController: UIViewController?

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

    if let sharedController = UpdatesControllerRegistry.sharedInstance.controller as? UpdatesDevLauncherInterface {
      // for some reason the swift compiler and bridge are having issues here
      EXDevLauncherController.sharedInstance().updatesInterface = sharedController
      sharedController.updatesExternalInterfaceDelegate = EXDevLauncherController.sharedInstance()
    }

    EXDevLauncherController.sharedInstance().start(self, launchOptions: launchOptions)

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties

    let viewController = EXDevLauncherController.sharedInstance().createRootViewController()
    rootViewController = viewController

    // We need to create a wrapper View because React Native Factory will reassign rootViewController later
    let wrapperView = DevLauncherWrapperView()
    wrapperView.devLauncherViewController = viewController
    wrapperView.addSubview(viewController.view)
    wrapperView.setupDevLauncherView(viewController)
    return wrapperView
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
    guard let reactDelegate = self.reactDelegate else {
      fatalError("`reactDelegate` should not be nil")
    }

    self.reactNativeFactory = reactDelegate.reactNativeFactory as? RCTReactNativeFactory

    // Reset rctAppDelegate so we can relaunch the app
    if RCTIsNewArchEnabled() {
      self.reactNativeFactory?.rootViewFactory.setValue(nil, forKey: "_reactHost")
    } else {
      self.reactNativeFactory?.bridge = nil
      self.reactNativeFactory?.rootViewFactory.bridge = nil
    }

    #if RCT_DEV_MENU
    // Set core dev menu configuration to disable shortcuts and shake gesture
    self.reactNativeFactory?.devMenuConfiguration = RCTDevMenuConfiguration(
      devMenuEnabled: true,
      shakeGestureEnabled: false,
      keyboardShortcutsEnabled: false
    )
    #endif

    let rootView = reactDelegate.reactNativeFactory.recreateRootView(
      withBundleURL: developmentClientController.sourceUrl(),
      moduleName: self.rootViewModuleName,
      initialProps: self.rootViewInitialProperties,
      launchOptions: developmentClientController.getLaunchOptions()
    )
    developmentClientController.appBridge = RCTBridge.current()

    let targetVC: UIViewController
#if !os(macOS)
    let windowRootVC = rootViewController?.view?.window?.rootViewController

    if let windowRootVC, let rootViewController {
      // Greenfield: add DevLauncherViewController as a child of the window's root VC
      // so react-native-screens finds a VC in the containment hierarchy with correct
      // layout margins.
      rootViewController.view = rootView
      if rootViewController.parent != windowRootVC {
        windowRootVC.addChild(rootViewController)
      }
      rootViewController.view.frame = windowRootVC.view.bounds
      rootViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      windowRootVC.view.addSubview(rootViewController.view)
      rootViewController.didMove(toParent: windowRootVC)
      return
    } else if let rootViewController {
      // Brownfield: the wrapper is embedded in a custom hierarchy, fall back to
      // DevLauncherViewController to avoid replacing the host app's root view.
      targetVC = rootViewController
    } else if let fallbackVC = self.reactDelegate?.createRootViewController() {
      targetVC = fallbackVC
    } else {
      fatalError("Invalid rootViewController returned from ExpoReactDelegate")
    }
#else
    // macOS: NSWindow has no rootViewController, fall back to DevLauncherViewController.
    if let rootViewController {
      targetVC = rootViewController
    } else if let fallbackVC = self.reactDelegate?.createRootViewController() {
      targetVC = fallbackVC
    } else {
      fatalError("Invalid rootViewController returned from ExpoReactDelegate")
    }
#endif
#if os(macOS)
    let newViewController = UIViewController()
    newViewController.view = rootView

    targetVC.view.subviews.forEach { $0.removeFromSuperview() }
    targetVC.addChild(newViewController)
    targetVC.view.addSubview(newViewController.view)

    newViewController.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      newViewController.view.topAnchor.constraint(equalTo: targetVC.view.topAnchor),
      newViewController.view.leadingAnchor.constraint(equalTo: targetVC.view.leadingAnchor),
      newViewController.view.trailingAnchor.constraint(equalTo: targetVC.view.trailingAnchor),
      newViewController.view.bottomAnchor.constraint(equalTo: targetVC.view.bottomAnchor)
    ])
#else
    targetVC.view = rootView
#endif
    // it is purposeful that we don't clean up saved properties here, because we may initialize
    // several React instances over a single app lifetime and we want them all to have the same
    // initial properties
  }
}
