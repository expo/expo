// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXUpdatesInterface

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
    EXDevLauncherController.sharedInstance().start(self, launchOptions: launchOptions)
    if let sharedController = UpdatesControllerRegistry.sharedInstance.controller {
      // for some reason the swift compiler and bridge are having issues here
      EXDevLauncherController.sharedInstance().updatesInterface = sharedController
      sharedController.updatesExternalInterfaceDelegate = EXDevLauncherController.sharedInstance()
    }

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties

    let viewController = EXDevLauncherController.sharedInstance().createRootViewController()
    rootViewController = viewController

    // We need to create a wrapper View because React Native Factory will reassign rootViewController later
    let wrapperView = UIView()
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
    rootViewController.view = rootView
    // it is purposeful that we don't clean up saved properties here, because we may initialize
    // several React instances over a single app lifetime and we want them all to have the same
    // initial properties
  }
}
