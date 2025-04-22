// Copyright 2015-present 650 Industries. All rights reserved.

import React_RCTAppDelegate

public class ExpoReactNativeFactory: RCTReactNativeFactory {
  private let reactDelegate = ExpoReactDelegate(handlers: ExpoAppDelegateSubscriberRepository.reactDelegateHandlers)

  @objc func createRCTRootViewFactory() -> RCTRootViewFactory {
    // Alan: This is temporary. We need to cast to ExpoReactNativeFactoryDelegate here because currently, if you extend RCTReactNativeFactory
    // from Swift, customizeRootView will not work on the new arch because the cast to RCTRootView will never
    // succeed which breaks expo-splash-screen and react-native-bootsplash.
    guard let weakDelegate = self.delegate as? ExpoReactNativeFactoryDelegate else {
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
      return weakDelegate.createRootView(with: bridge, moduleName: moduleName, initProps: initProps)
    }

    // TODO: Remove this check when react-native-macos releases v0.79
    if configuration.responds(to: Selector(("setJsRuntimeConfiguratorDelegate:"))) {
      configuration.setValue(delegate, forKey: "jsRuntimeConfiguratorDelegate")
    }

    configuration.createBridgeWithDelegate = { delegate, launchOptions in
      weakDelegate.createBridge(with: delegate, launchOptions: launchOptions)
    }

    configuration.customizeRootView = { rootView in
      weakDelegate.customize(rootView)
    }

    // NOTE(kudo): `sourceURLForBridge` is not referenced intentionally because it does not support New Architecture.
    configuration.sourceURLForBridge = nil

    configuration.loadSourceForBridgeWithProgress = { bridge, onProgress, onComplete in
      weakDelegate.loadSource(for: bridge, onProgress: onProgress, onComplete: onComplete)
    }

    if weakDelegate.responds(to: #selector(RCTReactNativeFactoryDelegate.extraModules(for:))) {
      configuration.extraModulesForBridge = { bridge in
        weakDelegate.extraModules(for: bridge)
      }
    }

    if weakDelegate.responds(to: #selector(RCTReactNativeFactoryDelegate.extraLazyModuleClasses(for:))) {
      configuration.extraLazyModuleClassesForBridge = { bridge in
        weakDelegate.extraLazyModuleClasses(for: bridge)
      }
    }

    if weakDelegate.responds(to: #selector(RCTReactNativeFactoryDelegate.bridge(_:didNotFindModule:))) {
      configuration.bridgeDidNotFindModule = { bridge, moduleName in
        weakDelegate.bridge(bridge, didNotFindModule: moduleName)
      }
    }

    return ExpoReactRootViewFactory(
      reactDelegate: reactDelegate,
      configuration: configuration,
      turboModuleManagerDelegate: self
    )
  }
}
