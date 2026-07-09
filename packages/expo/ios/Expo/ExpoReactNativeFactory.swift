// Copyright 2015-present 650 Industries. All rights reserved.

import React
import React_RCTAppDelegate
// TODO(spm): revisit — SwiftPM requires importing the sibling ExpoObjC Clang
// target to reference EXReactNativeFactory (NS_SWIFT_NAME ExpoReactNativeFactoryObjC)
// and EXReactRootViewFactory. Under CocoaPods there is no such module — the pod
// builds Swift and ObjC as ONE module — hence the canImport guard.
#if canImport(ExpoObjC)
import ExpoObjC
#endif

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
      newArchEnabled: true
    )

    configuration.jsRuntimeConfiguratorDelegate = delegate

    configuration.customizeRootView = { rootView in
      weakDelegate.customize(rootView)
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

    let rootView: UIView
    if let factory = self.rootViewFactory as? ExpoReactRootViewFactory {
      // RCTDevMenuConfiguration is only available in react-native 0.83+
#if os(iOS) || os(tvOS)
      // When calling `recreateRootViewWithBundleURL:` from `EXReactRootViewFactory`,
      // we don't want to loop the ReactDelegate again. Otherwise, it will be an infinite loop.
      rootView = factory.superView(
        withModuleName: moduleName ?? defaultModuleName,
        initialProperties: initialProps,
        launchOptions: launchOptions ?? [:],
        bundleConfiguration: RCTBundleConfiguration.default(),
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
      rootView = rootViewFactory.view(
        withModuleName: moduleName ?? defaultModuleName,
        initialProperties: initialProps,
        launchOptions: launchOptions,
        bundleConfiguration: RCTBundleConfiguration.default(),
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
