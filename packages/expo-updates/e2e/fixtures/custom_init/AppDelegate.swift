import Expo
import EXUpdates
import React
import ReactAppDependencyProvider

class CustomReactNativeFactoryDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins
  let packagerUrl = URL(string: "http://localhost:8081/index.bundle?platform=ios&dev=true")
  let bundledUrl = Bundle.main.url(forResource: "main", withExtension: "jsbundle")

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    if AppDelegate.isRunningWithPackager() {
      return packagerUrl
    }
    if let updatesUrl = AppDelegate.shared().updatesController?.launchAssetUrl() {
      return updatesUrl
    }
    return bundledUrl
  }
}

@UIApplicationMain
class AppDelegate: ExpoAppDelegate {
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  // AppDelegate keeps a nullable reference to the updates controller
  var updatesController: (any InternalAppControllerInterface)?
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  static func shared() -> AppDelegate {
    guard let delegate = UIApplication.shared.delegate as? AppDelegate else {
      fatalError("Could not get app delegate")
    }
    return delegate
  }

  // If this is a debug build, and native debugging not enabled,
  // then this returns true.
  static func isRunningWithPackager() -> Bool {
    return EXAppDefines.APP_DEBUG && !UpdatesUtils.isNativeDebuggingEnabled()
  }

  // Required initialization of react-native and expo-updates
  private func initializeReactNativeAndUpdates(_ launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    self.launchOptions = launchOptions
    let delegate = CustomReactNativeFactoryDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

    // AppController instance must always be created first.
    // expo-updates creates a different type of controller
    // depending on whether updates is enabled, and whether
    // we are running in development mode or not.
    AppController.initializeWithoutStarting()
  }

  /**
   Application launch initializes the custom view controller: all React Native
   and updates initialization is handled there
   */
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    initializeReactNativeAndUpdates(launchOptions)

    // Create custom view controller, where the React Native view will be created
    self.window = UIWindow(frame: UIScreen.main.bounds)
    let controller = CustomViewController()
    controller.view.clipsToBounds = true
    self.window?.rootViewController = controller
    window?.makeKeyAndVisible()

    return true
  }

  override func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return super.application(app, open: url, options: options) ||
      RCTLinkingManager.application(app, open: url, options: options)
  }
}

/**
 Custom view controller that handles React Native and expo-updates initialization
 */
public class CustomViewController: UIViewController, AppControllerDelegate {
  let appDelegate = AppDelegate.shared()

  /**
   If updates is enabled, the initializer starts the expo-updates system,
   and view initialization is deferred to the expo-updates completion handler (onSuccess())
   */
  public convenience init() {
    self.init(nibName: nil, bundle: nil)
    self.view.backgroundColor = .clear
    if AppDelegate.isRunningWithPackager() {
      // No expo-updates, just create the view
      createView()
    } else {
      // Set the updatesController property in AppDelegate so its bundleURL() method
      // works as expected
      appDelegate.updatesController = AppController.sharedInstance
      AppController.sharedInstance.delegate = self
      AppController.sharedInstance.start()
    }
  }

  required public override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
    super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)
  }

  @available(*, unavailable)
  required public init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  /**
   expo-updates completion handler creates the root view and adds it to the controller's view
   */
  public func appController(
    _ appController: AppControllerInterface,
    didStartWithSuccess success: Bool
  ) {
    createView()
  }

  private func createView() {
    guard let rootViewFactory: RCTRootViewFactory = appDelegate.reactNativeFactory?.rootViewFactory else {
      fatalError("rootViewFactory has not been initialized")
    }
    let rootView = rootViewFactory.view(
      withModuleName: "main",
      initialProperties: [:],
      launchOptions: appDelegate.launchOptions
    )
    let controller = self
    controller.view.clipsToBounds = true
    controller.view.addSubview(rootView)
    rootView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      rootView.topAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.topAnchor),
      rootView.bottomAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.bottomAnchor),
      rootView.leadingAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.leadingAnchor),
      rootView.trailingAnchor.constraint(equalTo: controller.view.safeAreaLayoutGuide.trailingAnchor)
    ])
  }
}
