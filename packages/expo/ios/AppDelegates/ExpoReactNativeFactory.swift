// Copyright 2015-present 650 Industries. All rights reserved.

import React

public class ExpoReactNativeFactory: RCTReactNativeFactory, ExpoReactNativeFactoryProtocol {
  private let defaultModuleName = "main"
  private lazy var reactDelegate: ExpoReactDelegate = {
     ExpoReactDelegate(
      handlers: ExpoAppDelegateSubscriberRepository.reactDelegateHandlers,
      reactNativeFactory: self
    )
  }()

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

  @MainActor
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

  public func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView {
    guard let delegate = self.delegate else {
      fatalError("recreateRootView: Missing RCTReactNativeFactoryDelegate")
    }

    if delegate.newArchEnabled() {
      // chrfalch: rootViewFactory.reactHost is not available here in swift due to the underlying RCTHost type of the property. (todo: check)
      assert(self.rootViewFactory.value(forKey: "reactHost") == nil, "recreateRootViewWithBundleURL: does not support when react instance is created")
    } else {
      assert(self.rootViewFactory.bridge == nil, "recreateRootViewWithBundleURL: does not support when react instance is created")
    }

    let configuration = self.rootViewFactory.value(forKey: "_configuration") as? RCTRootViewFactoryConfiguration

    if let bundleURL = withBundleURL {
      configuration?.bundleURLBlock = {
        return bundleURL
      }
    }

    let rootView: UIView
    if let factory = self.rootViewFactory as? ExpoReactRootViewFactory {
      // When calling `recreateRootViewWithBundleURL:` from `EXReactRootViewFactory`,
      // we don't want to loop the ReactDelegate again. Otherwise, it will be an infinite loop.
      rootView = factory.superView(
        withModuleName: moduleName ?? defaultModuleName,
        initialProperties: initialProps,
        launchOptions: launchOptions ?? [:]
      )
    } else {
      rootView = rootViewFactory.view(
        withModuleName: moduleName ?? defaultModuleName,
        initialProperties: initialProps,
        launchOptions: launchOptions
      )
    }

    return rootView
  }
}
