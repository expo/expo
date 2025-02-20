/**
 Implements a subclass of EXReactNativeFactory. By having both an objective-c and a swift override we can utilise
 objective-c's mechanisms until the root RCTReactNativeFactory is swiftified.
 */
public class ExpoReactNativeFactory: EXReactNativeFactory {
  private var reactDelegate: ExpoReactDelegate?

  @objc public init(delegate: ExpoReactNativeFactoryDelegate, reactDelegate: ExpoReactDelegate) {
    self.reactDelegate = reactDelegate
    super.init(delegate: delegate)
  }

  @objc func internalCreateRCTRootViewFactory() -> RCTRootViewFactory {
    guard let weakDelegate = self.delegate else {
      fatalError("ExpoReactNativeFactory: delegate is nil.")
    }

    let bundleUrlBlock: RCTBundleURLBlock = { [weak weakDelegate] in
      return weakDelegate?.bundleURL()
    }

    let configuration = RCTRootViewFactoryConfiguration(
      bundleURLBlock: bundleUrlBlock,
      newArchEnabled: weakDelegate.newArchEnabled()
    )

    configuration.createRootViewWithBridge = { bridge, moduleName, initProps in
      guard let createRootView = weakDelegate.createRootView else {
        fatalError("ExpoReactNativeFactory: createRootView is nil.")
      }
      return createRootView(bridge, moduleName, initProps)
    }

    configuration.createBridgeWithDelegate = { delegate, launchOptions in
      guard let createBridge = weakDelegate.createBridge else {
        fatalError("ExpoReactNativeFactory: createBridge is nil.")
      }
      return createBridge(delegate, launchOptions)
    }

    configuration.customizeRootView = { rootView in
      weakDelegate.customize(rootView as? RCTRootView)
    }

    // NOTE(kudo): `sourceURLForBridge` is not referenced intentionally because it does not support New Architecture.
    configuration.sourceURLForBridge = nil

    if weakDelegate.responds(to: #selector(RCTReactNativeFactoryDelegate.extraModules(for:))) {
      configuration.extraModulesForBridge = { bridge in
        return weakDelegate.extraModules?(for: bridge) ?? []
      }
    }

    if weakDelegate.responds(to: #selector(RCTReactNativeFactoryDelegate.extraLazyModuleClasses(for:))) {
      configuration.extraLazyModuleClassesForBridge = { bridge in
	    return weakDelegate.extraLazyModuleClasses?(for: bridge) ?? [:]
      }
    }

    if weakDelegate.responds(to: #selector(RCTReactNativeFactoryDelegate.bridge(_:didNotFindModule:))) {
      configuration.bridgeDidNotFindModule = { bridge, moduleName in
        weakDelegate.bridge?(bridge, didNotFindModule: moduleName) ?? false
      }
    }

    return ExpoReactRootViewFactory(
      reactDelegate: reactDelegate,
      configuration: configuration,
      turboModuleManagerDelegate: weakDelegate
    )
  }
}
