import React_RCTAppDelegate

private var reactDelegateHandlers = [ExpoReactDelegateHandler]()

@objc(EXAppInstance)
open class ExpoAppInstance: RCTAppDelegate {
  /**
   When using AppDelegate.mm which does not inherit ExpoAppInstance directly,
   we pass an appDelegate to allow execute functions upon the true AppDelegate.
   */
  private weak var appDelegate: RCTAppDelegate?

  @objc
  public convenience init(appDelegate: RCTAppDelegate) {
    self.init()
    self.appDelegate = appDelegate
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

  @objc
  open override func createRCTRootViewFactory() -> RCTRootViewFactory {
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
      return appDelegate.createRootView(with: bridge, moduleName: moduleName, initProps: initProps)
    }

    configuration.createBridgeWithDelegate = { delegate, launchOptions in
      return appDelegate.createBridge(with: delegate, launchOptions: launchOptions)
    }

    configuration.customizeRootView = { rootView in
      // @tsapeta: We cannot just call `self.customize(rootView)` – see the comment of the `customizeRootView:byAppDelegate:` function in EXAppDelegateWrapper.h
      return EXAppDelegateWrapper.customizeRootView(rootView, by: appDelegate)
    }

    // NOTE(kudo): `sourceURLForBridge` is not referenced intentionally because it does not support New Architecture.
    configuration.sourceURLForBridge = nil

    if responds(to: #selector(extraModules(for:))) {
      configuration.extraModulesForBridge = { bridge in
        return appDelegate.extraModules(for: bridge)
      }
    }

    if responds(to: #selector(extraLazyModuleClasses(for:))) {
      configuration.extraLazyModuleClassesForBridge = { bridge in
        return appDelegate.extraLazyModuleClasses(for: bridge)
      }
    }

    if responds(to: #selector(bridge(_:didNotFindModule:))) {
      configuration.bridgeDidNotFindModule = { bridge, moduleName in
        return appDelegate.bridge(bridge, didNotFindModule: moduleName)
      }
    }

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
