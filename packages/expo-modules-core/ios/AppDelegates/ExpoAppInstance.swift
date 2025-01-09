import React_RCTAppDelegate

private var reactDelegateHandlers = [ExpoReactDelegateHandler]()

@objc(EXAppInstance)
open class ExpoAppInstance: RCTAppDelegate {
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
    let bundleUrlBlock: RCTBundleURLBlock = { [weak self] in
      return self?.bundleURL()
    }

    let configuration = RCTRootViewFactoryConfiguration(
      bundleURLBlock: bundleUrlBlock,
      newArchEnabled: newArchEnabled(),
      turboModuleEnabled: turboModuleEnabled(),
      bridgelessEnabled: bridgelessEnabled()
    )

    configuration.createRootViewWithBridge = { bridge, moduleName, initProps in
      return self.createRootView(with: bridge, moduleName: moduleName, initProps: initProps)
    }

    configuration.createBridgeWithDelegate = { delegate, launchOptions in
      return self.createBridge(with: delegate, launchOptions: launchOptions)
    }

    configuration.customizeRootView = { rootView in
      // @tsapeta: We cannot just call `self.customize(rootView)` – see the comment of the `customizeRootView:byAppDelegate:` function in EXAppDelegateWrapper.h
      return EXAppDelegateWrapper.customizeRootView(rootView, by: self)
    }

    // NOTE(kudo): `sourceURLForBridge` is not referenced intentionally because it does not support New Architecture.
    configuration.sourceURLForBridge = nil

    if responds(to: #selector(extraModules(for:))) {
      configuration.extraModulesForBridge = { bridge in
        return self.extraModules(for: bridge)
      }
    }

    if responds(to: #selector(extraLazyModuleClasses(for:))) {
      configuration.extraLazyModuleClassesForBridge = { bridge in
        return self.extraLazyModuleClasses(for: bridge)
      }
    }

    if responds(to: #selector(bridge(_:didNotFindModule:))) {
      configuration.bridgeDidNotFindModule = { bridge, moduleName in
        return self.bridge(bridge, didNotFindModule: moduleName)
      }
    }

    return ExpoReactRootViewFactory(
      reactDelegate: reactDelegate,
      configuration: configuration,
      turboModuleManagerDelegate: self
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
