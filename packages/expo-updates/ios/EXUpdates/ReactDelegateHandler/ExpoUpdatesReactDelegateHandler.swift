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

    // If startup already completed, create the real view directly to handle
    // brownfield re-mounts and simultaneous multi-view scenarios, given that
    // didStartWithSuccess fires only once per controller lifetime.
    if controller.isStarted, let launchAssetUrl = controller.launchAssetUrl() {
      return reactDelegate.reactNativeFactory.recreateRootView(
        withBundleURL: launchAssetUrl,
        moduleName: moduleName,
        initialProps: initialProperties,
        launchOptions: launchOptions
      )
    }

    self.reactDelegate = reactDelegate
    self.launchOptions = launchOptions
    if !controller.isStarted {
      controller.delegate = self
      controller.start()
    }

    self.rootViewModuleName = moduleName
    self.rootViewInitialProperties = initialProperties
    self.deferredRootView = EXDeferredRCTRootView()

#if os(iOS) || os(tvOS)
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
#endif
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

    let rootView = reactDelegate.reactNativeFactory.recreateRootView(
      withBundleURL: AppController.sharedInstance.launchAssetUrl(),
      moduleName: self.rootViewModuleName,
      initialProps: self.rootViewInitialProperties,
      launchOptions: self.launchOptions
    )

#if os(iOS) || os(tvOS)
    rootView.backgroundColor = self.deferredRootView?.backgroundColor ?? UIColor.white

    // In brownfield setups, the deferred root view is embedded within the host app's
    // view hierarchy (e.g. inside a NavigationController). Replacing the window's root
    // view controller would break the host app's navigation. Instead, find the view
    // controller that owns the deferred view and replace its view in-place.
    if let deferredRootView = self.deferredRootView,
      let owningViewController = findViewController(for: deferredRootView),
      owningViewController != getWindow().rootViewController {
      owningViewController.view = rootView
    } else {
      let window = getWindow()
      let rootViewController = reactDelegate.createRootViewController()
      rootViewController.view = rootView
      window.rootViewController = rootViewController
      window.makeKeyAndVisible()
    }
#else
    let window = getWindow()
    let rootViewController = reactDelegate.createRootViewController()
    rootViewController.view = rootView
    rootView.frame = window.frame
    window.contentViewController = rootViewController
    window.makeKeyAndOrderFront(self)
    window.center()
#endif

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

#if os(iOS) || os(tvOS)
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

  /**
   Finds the nearest view controller that owns the given view by walking
   up the responder chain. Returns the first UIViewController whose view
   matches the target view.
   */
  private func findViewController(for view: UIView) -> UIViewController? {
    var responder: UIResponder? = view.next
    while let current = responder {
      if let viewController = current as? UIViewController, viewController.view == view {
        return viewController
      }
      responder = current.next
    }
    return nil
  }
#endif

  private func getWindow() -> UIWindow {
    #if os(macOS)
    guard let window = NSApplication.shared.windows.first(where: { $0.isKeyWindow }) ?? NSApplication.shared.mainWindow else {
      fatalError("Cannot find the current window.")
    }
    #else
    guard let window = UIApplication.shared.windows.filter(\.isKeyWindow).first ?? UIApplication.shared.delegate?.window as? UIWindow else {
      fatalError("Cannot find the current window.")
    }
    #endif
    return window
  }
}
