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
    if UpdatesUtils.isUsingCustomInitialization() {
      return nil
    }

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
    // This view can potentially be displayed for a while.
    // We should use the splashscreens view here, otherwise a black view appears in the middle of the launch sequence.
    if let view = createSplashScreenview(), let rootView = self.deferredRootView {
      view.translatesAutoresizingMaskIntoConstraints = false
      // The deferredRootView needs to be dark mode aware so we set the color to be the same as the splashscreen background.
      let backgroundColor = view.backgroundColor ?? UIColor(named: "SplashScreenBackground")
      rootView.backgroundColor = backgroundColor ?? .white
      rootView.addSubview(view)

      NSLayoutConstraint.activate([
        view.leadingAnchor.constraint(equalTo: rootView.leadingAnchor),
        view.trailingAnchor.constraint(equalTo: rootView.trailingAnchor),
        view.topAnchor.constraint(equalTo: rootView.topAnchor),
        view.bottomAnchor.constraint(equalTo: rootView.bottomAnchor)
      ])
    }
    return self.deferredRootView
  }

  public override func bundleURL(reactDelegate: ExpoReactDelegate) -> URL? {
    AppController.sharedInstance.launchAssetUrl()
  }

  // MARK: AppControllerDelegate implementations

  public func appController(_ appController: AppControllerInterface, didStartWithSuccess success: Bool) {
    if UpdatesUtils.isUsingCustomInitialization() {
      return
    }
    guard let reactDelegate = self.reactDelegate else {
      fatalError("`reactDelegate` should not be nil")
    }

    guard let appDelegate = (UIApplication.shared.delegate as? (any ReactNativeFactoryProvider)) ??
      ((UIApplication.shared.delegate as? NSObject)?.value(forKey: "_expoAppDelegate") as? (any ReactNativeFactoryProvider)) else {
      fatalError("`UIApplication.shared.delegate` must be an `ExpoAppDelegate` or `EXAppDelegateWrapper`")
    }

    let rootView = appDelegate.recreateRootView(
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

  private func createSplashScreenview() -> UIView? {
    var view: UIView?
    let mainBundle = Bundle.main
    let launchScreen = mainBundle.object(forInfoDictionaryKey: "UILaunchStoryboardName") as? String ?? "LaunchScreen"

    if mainBundle.path(forResource: launchScreen, ofType: "storyboard") != nil ||
      mainBundle.path(forResource: launchScreen, ofType: "storyboardc") != nil {
      let launchScreenStoryboard = UIStoryboard(name: launchScreen, bundle: nil)
      let viewController = launchScreenStoryboard.instantiateInitialViewController()
      view = viewController?.view
      viewController?.view = nil
    } else if mainBundle.path(forResource: launchScreen, ofType: "nib") != nil {
      let views = mainBundle.loadNibNamed(launchScreen, owner: self)
      view = views?.first as? UIView
    }

    return view
  }

  private func getWindow() -> UIWindow {
    guard let window = UIApplication.shared.windows.filter(\.isKeyWindow).first ?? UIApplication.shared.delegate?.window as? UIWindow else {
      fatalError("Cannot find the current window.")
    }
    return window
  }
}
