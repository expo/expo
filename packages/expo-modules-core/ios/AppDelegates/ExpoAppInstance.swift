import React_RCTAppDelegate
#if canImport(ReactAppDependencyProvider)
  import ReactAppDependencyProvider
#endif

private var reactDelegateHandlers = [ExpoReactDelegateHandler]()

public typealias ExpAppDelegateProtocol = UIApplicationDelegate & UISceneDelegate & RCTReactNativeFactoryDelegate

@objc(EXAppInstance)
open class ExpoAppInstance: EXReactNativeFactoryDelegate, UIApplicationDelegate, UISceneDelegate {
  /**
   When using AppDelegate.mm which does not inherit ExpoAppInstance directly,
   we pass an appDelegate to allow execute functions upon the true AppDelegate.
   */
  private weak var appDelegate: RCTReactNativeFactoryDelegate?
  
  public var reactNativeFactory: RCTReactNativeFactory?
  
  public var bridge: RCTBridge?
  public var window: UIWindow?
  
  @objc public var moduleName: NSString = ""
  @objc public var initialProps: [AnyHashable : Any]?
  
  
//	private lazy var rootViewFactoryInstance: RCTRootViewFactory = createRCTRootViewFactory()

  @objc
  public convenience init(appDelegate: RCTReactNativeFactoryDelegate) {
    self.init()
    self.appDelegate = appDelegate
    self.reactNativeFactory = EXReactNativeFactory(delegate: self, createRootViewFactory: createRCTRootViewFactory)
    
#if canImport(ReactAppDependencyProvider)
    self.dependencyProvider = RCTAppDependencyProvider()
#endif
  }
  
  open func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    loadReactNativeWindow(launchOptions: launchOptions)
    return true
  }
  
  func loadReactNativeWindow(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    let rootView = self.reactNativeFactory!.rootViewFactory.view(
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
     // TODO:
      let reactHost = self.reactNativeFactory.rootViewFactory.reactHost
        assert(reactHost == nil, "recreateRootViewWithBundleURL: does not support when react instance is created")
    } else {
        assert(self.rootViewFactory.bridge == nil, "recreateRootViewWithBundleURL: does not support when react instance is created")
    }*/

    let rootViewFactory = self.reactNativeFactory!.rootViewFactory
    let configuration = rootViewFactory.value(forKey: "_configuration") as? RCTRootViewFactoryConfiguration

    if let bundleURL = bundleURL {
        configuration?.bundleURLBlock = {
            return bundleURL
        }
    }

    if let moduleName = moduleName {
      self.moduleName = moduleName as NSString
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
  
  func createRCTRootViewFactory() -> RCTRootViewFactory {
    
    let appDelegate = self.appDelegate ?? self

    let bundleUrlBlock: RCTBundleURLBlock = { [weak self] in
      let appDelegateWeak = self?.appDelegate ?? self      
      return appDelegateWeak?.bundleURL()
    }

    let configuration = RCTRootViewFactoryConfiguration(
      bundleURLBlock: bundleUrlBlock,
      newArchEnabled: newArchEnabled(),
      turboModuleEnabled: turboModuleEnabled(),
      bridgelessEnabled: bridgelessEnabled()
    )

    configuration.createRootViewWithBridge = { bridge, moduleName, initProps in
      return appDelegate.createRootView!(with: bridge, moduleName: moduleName, initProps: initProps)
    }

    configuration.createBridgeWithDelegate = { delegate, launchOptions in
      return appDelegate.createBridge!(with: delegate, launchOptions: launchOptions)
    }

    configuration.customizeRootView = { rootView in
      // @tsapeta: We cannot just call `self.customize(rootView)` – see the comment of the `customizeRootView:byAppDelegate:` function in EXAppDelegateWrapper.h
      // TODO bring back this: return EXAppDelegateWrapper.customizeRootView(rootView, by: appDelegate as! RCTAppDelegate)
    }

    // NOTE(kudo): `sourceURLForBridge` is not referenced intentionally because it does not support New Architecture.
    configuration.sourceURLForBridge = nil

    if responds(to: #selector(extraModules(for:))) {
      configuration.extraModulesForBridge = { bridge in
        return appDelegate.extraModules!(for: bridge)
      }
    }

    if responds(to: #selector(extraLazyModuleClasses(for:))) {
      configuration.extraLazyModuleClassesForBridge = { bridge in
        return appDelegate.extraLazyModuleClasses!(for: bridge)
      }
    }

    if responds(to: #selector(bridge(_:didNotFindModule:))) {
      configuration.bridgeDidNotFindModule = { bridge, moduleName in
        return appDelegate.bridge!(bridge, didNotFindModule: moduleName)
      }
    }

	// this doesn't work because self.reactNativeFactory is nil at this point; this should be in a subclass of RCTReactNativeFactory?
    return ExpoReactRootViewFactory(
      reactDelegate: reactDelegate,
      configuration: configuration,
			turboModuleManagerDelegate: appDelegate
    )
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
