// Copyright 2015-present 650 Industries. All rights reserved.

import React

public class ExpoReactNativeFactory: ExpoReactNativeFactoryObjC, ExpoReactNativeFactoryProtocol {
  private let defaultModuleName = "main"

  @MainActor
  private lazy var reactDelegate: ExpoReactDelegate = {
    ExpoReactDelegate(
      handlers: ExpoAppDelegateSubscriberRepository.reactDelegateHandlers,
      reactNativeFactory: self
    )
  }()

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

  // `RCTBundleConfiguration` is only available in react-native 0.84+, so it doesn't exist yet on react-native-macos.
#if os(iOS) || os(tvOS)
  private var _bundleConfiguration: RCTBundleConfiguration?

  public override var bundleConfiguration: RCTBundleConfiguration {
    get {
      if let _bundleConfiguration {
        return _bundleConfiguration
      }
      adoptInfoPlistMetroPort()
      return ExpoBundleConfiguration.configuration(bundleURL: self.delegate?.bundleURL())
    }
    set {
      _bundleConfiguration = newValue
    }
  }

  private func adoptInfoPlistMetroPort() {
#if DEBUG
    if NSClassFromString("EXDevLauncherController") != nil {
      return
    }
    guard let port = Bundle.main.object(forInfoDictionaryKey: "RCTMetroPort") as? String,
      !port.isEmpty else {
      return
    }
    var host = "localhost"
    if let ipPath = Bundle.main.path(forResource: "ip", ofType: "txt"),
      let ip = try? String(contentsOfFile: ipPath, encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines),
      !ip.isEmpty {
      host = ip
    }
    let settings = RCTBundleURLProvider.sharedSettings()
    let target = "\(host):\(port)"
    if settings.jsLocation != target {
      settings.jsLocation = target
    }
#endif
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

    let configuration = self.rootViewFactory.value(forKey: "_configuration") as? RCTRootViewFactoryConfiguration

    if let bundleURL = withBundleURL {
      configuration?.bundleURLBlock = {
        return bundleURL
      }
    }

#if os(iOS) || os(tvOS)
    adoptInfoPlistMetroPort()
#endif

    let rootView: UIView
    if let factory = self.rootViewFactory as? ExpoReactRootViewFactory {
      // RCTDevMenuConfiguration is only available in react-native 0.83+
      // bundleConfiguration is only accepted in react-native 0.84+
#if os(iOS) || os(tvOS)
      let bundleConfiguration = ExpoBundleConfiguration.configuration(
        bundleURL: withBundleURL ?? configuration?.bundleURLBlock()
      )
      // When calling `recreateRootViewWithBundleURL:` from `EXReactRootViewFactory`,
      // we don't want to loop the ReactDelegate again. Otherwise, it will be an infinite loop.
      rootView = factory.superView(
        withModuleName: moduleName ?? defaultModuleName,
        initialProperties: initialProps,
        launchOptions: launchOptions ?? [:],
        bundleConfiguration: bundleConfiguration,
        devMenuConfiguration: self.devMenuConfiguration
      )
#else
      rootView = factory.superView(
        withModuleName: moduleName ?? defaultModuleName,
        initialProperties: initialProps,
        launchOptions: launchOptions ?? [:]
      )
#endif
    } else {
#if os(iOS) || os(tvOS)
      let bundleConfiguration = ExpoBundleConfiguration.configuration(
        bundleURL: withBundleURL ?? configuration?.bundleURLBlock()
      )
      rootView = rootViewFactory.view(
        withModuleName: moduleName ?? defaultModuleName,
        initialProperties: initialProps,
        launchOptions: launchOptions,
        bundleConfiguration: bundleConfiguration,
        devMenuConfiguration: self.devMenuConfiguration ?? RCTDevMenuConfiguration.default()
      )
#else
      rootView = rootViewFactory.view(
        withModuleName: moduleName ?? defaultModuleName,
        initialProperties: initialProps,
        launchOptions: launchOptions
      )
#endif
    }

    return rootView
  }
}
