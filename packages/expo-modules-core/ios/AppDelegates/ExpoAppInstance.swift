import React_RCTAppDelegate

private var reactDelegateHandlers = [ExpoReactDelegateHandler]()

public typealias ExpAppDelegateProtocol = UIApplicationDelegate & UISceneDelegate & RCTReactNativeFactoryDelegate

@objc(EXAppInstance)
open class ExpoAppInstance: EXReactNativeFactoryDelegate, UIApplicationDelegate, UISceneDelegate {
  /**
   When using AppDelegate.mm which does not inherit ExpoAppInstance directly,
   we pass an appDelegate to allow execute functions upon the true AppDelegate.
   */
  private weak var appDelegate: RCTReactNativeFactoryDelegate?
  
  /// The window object, used to render the UIViewControllers
  public var window: UIWindow?

  /// From RCTAppDelegate
  @objc public var bridge: RCTBridge?
  @objc public var moduleName: String = ""
  @objc public var initialProps: [AnyHashable: Any]?

  public private(set) var reactNativeFactory: ExpoReactNativeFactory?

  /// If `automaticallyLoadReactNativeWindow` is set to `true`, the React Native window will be loaded automatically.
  public var automaticallyLoadReactNativeWindow: Bool = true
  
  // Default initializer
  public override init() {
    super.init()
    self.reactNativeFactory = ExpoReactNativeFactory(delegate: self, reactDelegate: self.reactDelegate)    
  }

  @objc
  public convenience init(appDelegate: RCTReactNativeFactoryDelegate) {
    self.init()
    self.appDelegate = appDelegate
  }
  
  open func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if (automaticallyLoadReactNativeWindow) {
      loadReactNativeWindow(launchOptions: launchOptions)
    }
    return true
  }
  
  func loadReactNativeWindow(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    guard let reactNativeFactory = self.reactNativeFactory else {
      fatalError("loadReactNativeWindow: Missing reactNativeFactory in ExpoAppInstance")
    }
    let rootView = reactNativeFactory.rootViewFactory.view(
        withModuleName: self.moduleName as String,
        initialProperties: self.initialProps,
        launchOptions: launchOptions
    )

    let window = UIWindow(frame: UIScreen.main.bounds)
    let rootViewController = createRootViewController()

    setRootView(rootView, toRootViewController: rootViewController)
    
    window.windowScene?.delegate = self
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()
    
    self.window = window
  }

  @objc
  public let reactDelegate = ExpoReactDelegate(handlers: reactDelegateHandlers)
  
  @objc
  open override func createRootViewController() -> UIViewController {
    return reactDelegate.createRootViewController()
  }

  open override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
  
  
  func windowScene(_ windowScene: UIWindowScene,
                    didUpdate previousCoordinateSpace: UICoordinateSpace,
                    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
                    traitCollection previousTraitCollection: UITraitCollection) {
       NotificationCenter.default.post(name: NSNotification.Name(rawValue: "RCTWindowFrameDidChangeNotification"), object: self)
  }
  
  func recreateRootView(bundleURL: URL?,
                        moduleName: String?,
                        initialProps: [AnyHashable: Any]?,
                        launchOptions: [AnyHashable: Any]?) -> UIView {
    /*if self.newArchEnabled() {
     // TODO(chrfalch)
      let reactHost = self.reactNativeFactory.rootViewFactory.reactHost
        assert(reactHost == nil, "recreateRootViewWithBundleURL: does not support when react instance is created")
    } else {
        assert(self.rootViewFactory.bridge == nil, "recreateRootViewWithBundleURL: does not support when react instance is created")
    }*/
    
    guard let reactNativeFactory = self.reactNativeFactory else {
      fatalError("recreateRootView: Missing reactNativeFactory in ExpoAppInstance")
    }

    let rootViewFactory = reactNativeFactory.rootViewFactory
    let configuration = rootViewFactory.value(forKey: "_configuration") as? RCTRootViewFactoryConfiguration

    if let bundleURL = bundleURL {
        configuration?.bundleURLBlock = {
            return bundleURL
        }
    }

    if let moduleName = moduleName {
      self.moduleName = moduleName
    }

    if let initialProps = initialProps {
      self.initialProps = initialProps
    }

    let rootView: UIView
    if let factory = rootViewFactory as? ExpoReactRootViewFactory {
        // When calling `recreateRootViewWithBundleURL:` from `EXReactRootViewFactory`,
        // we don't want to loop the ReactDelegate again. Otherwise, it will be an infinite loop.
        rootView = factory.superView(withModuleName: self.moduleName as String,
                                     initialProperties: self.initialProps ?? [:],
                                     launchOptions: launchOptions ?? [:])
    } else {
        rootView = rootViewFactory.view(withModuleName: self.moduleName as String,
                                        initialProperties: self.initialProps,
                                        launchOptions: launchOptions)
    }

    return rootView
  }

  open override func sourceURL(for bridge: RCTBridge) -> URL? {
    // This method is called only in the old architecture. For compatibility just use the result of a new `bundleURL` method.
    return bundleURL()
  }  
  
  // MARK: - Statics

  @objc
  public static func registerReactDelegateHandlersFrom(modulesProvider: ModulesProvider) {
    modulesProvider.getReactDelegateHandlers()
      .sorted { tuple1, tuple2 -> Bool in
        return ModulePriorities.get(tuple1.packageName) > ModulePriorities.get(tuple2.packageName)
      }
      .forEach { handlerTuple in
        reactDelegateHandlers.append(handlerTuple.handler.init())
      }
  }   
}
