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
  @objc public private(set) var rootViewModuleName: String?
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

    if !mount(rootView: rootView) {
      fatalError("Invalid rootViewController returned from ExpoReactDelegate")
    }
  }

  // MARK: - Mounting

  /// Mounts `rootView` into the appropriate container. Used by both the
  ///
  /// Returns `false` if neither the launcher's own VC nor a fresh one from
  /// the React delegate could be obtained — callers decide whether to
  /// `fatalError` (initial launch) or report failure (runtime swap).
  private func mount(rootView: UIView) -> Bool {
    let targetVC: UIViewController
#if !os(macOS)
    let windowRootVC = rootViewController?.view?.window?.rootViewController

    if let windowRootVC, let rootViewController {
      // Greenfield: add DevLauncherViewController as a child of the window's root VC
      // so react-native-screens finds a VC in the containment hierarchy with correct
      // layout margins.
      //
      // Note: this inserts DevLauncherViewController between ScreenOrientationViewController
      // (the window root VC) and RNSNavigationController, which blocks react-native-screens'
      // single-level VC traversal for orientation and other window traits.
      // ScreenOrientationViewController.vcWithRNScreenOrientation() works around this by
      // searching one level deeper through child VCs.
      rootViewController.view = rootView
      if rootViewController.parent != windowRootVC {
        windowRootVC.addChild(rootViewController)
      }
      rootViewController.view.frame = windowRootVC.view.bounds
      rootViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      windowRootVC.view.addSubview(rootViewController.view)
      rootViewController.didMove(toParent: windowRootVC)
      return true
    } else if let rootViewController {
      // Brownfield: the wrapper is embedded in a custom hierarchy, fall back to
      // DevLauncherViewController to avoid replacing the host app's root view.
      targetVC = rootViewController
    } else if let fallbackVC = self.reactDelegate?.createRootViewController() {
      targetVC = fallbackVC
    } else {
      return false
    }
#else
    // macOS: NSWindow has no rootViewController, fall back to DevLauncherViewController.
    if let rootViewController {
      targetVC = rootViewController
    } else if let fallbackVC = self.reactDelegate?.createRootViewController() {
      targetVC = fallbackVC
    } else {
      return false
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
    return true
  }

  // MARK: - Component switching from the dev menu

  /// Creates a fresh root view bound to `moduleName` using the existing
  /// React host (so the JS runtime is preserved) and mounts it into the
  /// same view controller container as the original launch. Returns
  /// `true` on success.
  @objc public func switchAppRegistryComponent(to moduleName: String) -> Bool {
    guard let reactDelegate = self.reactDelegate else {
      return false
    }

    self.rootViewModuleName = moduleName

    let rootView = reactDelegate.reactNativeFactory.recreateRootView(
      withBundleURL: nil,
      moduleName: moduleName,
      initialProps: self.rootViewInitialProperties,
      launchOptions: self.launchOptions
    )

    return mount(rootView: rootView)
  }
}
