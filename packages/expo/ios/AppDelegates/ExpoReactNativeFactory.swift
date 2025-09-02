// Copyright 2015-present 650 Industries. All rights reserved.

import React

@MainActor public class ExpoReactNativeFactory: RCTReactNativeFactory {
  private let reactDelegate = ExpoReactDelegate(handlers: ExpoAppDelegateSubscriberRepository.reactDelegateHandlers)

  // TODO: Remove check when react-native-macos 0.81 is released
  #if !os(macOS)
  @objc public override init(delegate: any RCTReactNativeFactoryDelegate) {
    let releaseLevel = (Bundle.main.object(forInfoDictionaryKey: "ReactNativeReleaseLevel") as? String)
      .flatMap { [
        "canary": RCTReleaseLevel.Canary,
        "experimental": RCTReleaseLevel.Experimental,
        "stable": RCTReleaseLevel.Stable
      ][$0.lowercased()]
      }
    ?? RCTReleaseLevel.Stable

    super.init(delegate: delegate, releaseLevel: releaseLevel)
  }
  #endif

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

    configuration.jsRuntimeConfiguratorDelegate = delegate

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
