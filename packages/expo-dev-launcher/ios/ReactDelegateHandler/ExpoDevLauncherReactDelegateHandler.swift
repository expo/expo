// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXUpdatesInterface
import React

private class DevLauncherWrapperView: UIView {
  weak var devLauncherViewController: UIViewController?

#if !os(macOS)
  override func didMoveToWindow() {
    super.didMoveToWindow()

    guard let devLauncherViewController,
      let window,
      let rootViewController = window.rootViewController else {
      return
    }

    let isSwiftUIController = NSStringFromClass(type(of: rootViewController)).contains("UIHostingController")
    // TODO(pmleczek): Revisit this for a more reliable solution
    let isBrownfield = NSStringFromClass(type(of: rootViewController)).contains("UINavigationController")
    if !isSwiftUIController && !isBrownfield && devLauncherViewController.parent != rootViewController {
      rootViewController.addChild(devLauncherViewController)
      devLauncherViewController.didMove(toParent: rootViewController)
      devLauncherViewController.view.setNeedsLayout()
      devLauncherViewController.view.layoutIfNeeded()
    }
  }

  override func willMove(toWindow newWindow: UIWindow?) {
    super.willMove(toWindow: newWindow)
    if newWindow == nil {
      devLauncherViewController?.willMove(toParent: nil)
      devLauncherViewController?.removeFromParent()
    }
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
    viewController.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      viewController.view.topAnchor.constraint(equalTo: wrapperView.topAnchor),
      viewController.view.leadingAnchor.constraint(equalTo: wrapperView.leadingAnchor),
      viewController.view.trailingAnchor.constraint(equalTo: wrapperView.trailingAnchor),
      viewController.view.bottomAnchor.constraint(equalTo: wrapperView.bottomAnchor)
    ])

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

    guard let rootViewController = rootViewController ?? self.reactDelegate?.createRootViewController() else {
      fatalError("Invalid rootViewController returned from ExpoReactDelegate")
    }
#if os(macOS)
    let newViewController = UIViewController()
    newViewController.view = rootView

    rootViewController.view.subviews.forEach { $0.removeFromSuperview() }
    rootViewController.addChild(newViewController)
    rootViewController.view.addSubview(newViewController.view)

    newViewController.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      newViewController.view.topAnchor.constraint(equalTo: rootViewController.view.topAnchor),
      newViewController.view.leadingAnchor.constraint(equalTo: rootViewController.view.leadingAnchor),
      newViewController.view.trailingAnchor.constraint(equalTo: rootViewController.view.trailingAnchor),
      newViewController.view.bottomAnchor.constraint(equalTo: rootViewController.view.bottomAnchor)
    ])
#else
    rootViewController.view = rootView
#endif
    // it is purposeful that we don't clean up saved properties here, because we may initialize
    // several React instances over a single app lifetime and we want them all to have the same
    // initial properties
  }
}
