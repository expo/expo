// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 * Manages and controls the auto-setup behavior of expo-updates in applicable environments.
 *
 * In order to deal with the asynchronous nature of updates startup, this class creates dummy
 * RCTBridge and RCTRootView objects to return to the ReactDelegate, replacing them with the real
 * objects when expo-updates is ready.
 */
public final class ExpoUpdatesReactDelegateHandler: ExpoReactDelegateHandler, AppControllerDelegate {
  private weak var reactDelegate: ExpoReactDelegate?
  private var launchOptions: [AnyHashable: Any]?
  private var deferredRootView: EXDeferredRCTRootView?
  private var rootViewModuleName: String?
  private var rootViewInitialProperties: [AnyHashable: Any]?

  public override func createReactRootView(
    reactDelegate: ExpoReactDelegate,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView? {
    AppController.initializeWithoutStarting()
    let controller = AppController.sharedInstance
    if !controller.isActiveController {
      return nil
    }

    self.reactDelegate = reactDelegate
    self.launchOptions = launchOptions
    controller.delegate = self
    controller.start()

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = EXDeferredRCTRootView()
    return self.deferredRootView
  }

  public override func bundleURL(reactDelegate: ExpoReactDelegate) -> URL? {
    AppController.sharedInstance.launchAssetUrl()
  }

  // MARK: AppControllerDelegate implementations

  public func appController(_ appController: AppControllerInterface, didStartWithSuccess success: Bool) {
    guard let reactDelegate = self.reactDelegate else {
      fatalError("`reactDelegate` should not be nil")
    }
    guard let rctAppDelegate = (UIApplication.shared.delegate as? RCTAppDelegate) else {
      fatalError("The `UIApplication.shared.delegate` is not a `RCTAppDelegate` instance.")
    }
    let rootView = rctAppDelegate.recreateRootView(
      withBundleURL: AppController.sharedInstance.launchAssetUrl(),
      moduleName: self.rootViewModuleName,
      initialProps: self.rootViewInitialProperties,
      launchOptions: self.launchOptions
    )
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white
    let window = getWindow()
    let rootViewController = reactDelegate.createRootViewController()
    rootViewController.view = rootView
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()

    self.cleanup()
  }

  // MARK: Internals

  /**
   Cleanup unused resources after react instance created.
   */
  private func cleanup() {
    self.reactDelegate = nil
    self.launchOptions = nil
    self.deferredRootView = nil
    self.rootViewModuleName = nil
    self.rootViewInitialProperties = nil
  }

  private func getWindow() -> UIWindow {
    guard let window = UIApplication.shared.windows.filter(\.isKeyWindow).first ?? UIApplication.shared.delegate?.window as? UIWindow else {
      fatalError("Cannot find the current window.")
    }
    return window
  }
}
