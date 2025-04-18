// Copyright 2015-present 650 Industries. All rights reserved.

import React_RCTAppDelegate

public class ExpoReactNativeFactory: RCTReactNativeFactory {
  private var reactDelegate: ExpoReactDelegate?

  @objc public init(delegate: ExpoReactNativeFactoryDelegate, reactDelegate: ExpoReactDelegate) {
    self.reactDelegate = reactDelegate
    super.init(delegate: delegate)
  }

  @objc func createRCTRootViewFactory() -> RCTRootViewFactory {
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

    // TODO: Remove this check when react-native-macos releases v0.79
    if configuration.responds(to: Selector("setJsRuntimeConfiguratorDelegate:")) {
      configuration.setValue(delegate, forKey: "jsRuntimeConfiguratorDelegate")
    }

    configuration.createBridgeWithDelegate = { delegate, launchOptions in
      guard let createBridge = weakDelegate.createBridge else {
        fatalError("ExpoReactNativeFactory: createBridge is nil.")
      }
      return createBridge(delegate, launchOptions)
    }

    configuration.customizeRootView = { rootView in
      guard let view = rootView as? RCTRootView else {
        return
      }
      weakDelegate.customize(view)
    }

    // NOTE(kudo): `sourceURLForBridge` is not referenced intentionally because it does not support New Architecture.
    configuration.sourceURLForBridge = nil

    configuration.loadSourceForBridgeWithProgress = { bridge, onProgress, onComplete in
      weakDelegate.loadSource?(for: bridge, onProgress: onProgress, onComplete: onComplete)
    }

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
