internal import Expo
internal import ExpoBrownfield
import Network
internal import React
internal import ReactAppDependencyProvider
import UIKit


public class ReactNativeHostManager {
  public static let shared = ReactNativeHostManager()

  private var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  private var reactNativeFactory: RCTReactNativeFactory?
  private var firstViewLoad: Bool = true

  /**
   * Initializes ReactNativeHostManager instance
   * Instance can be initialized only once
   */
  public func initialize() {
    // Prevent multiple initializations
    guard reactNativeDelegate == nil else {
      return
    }

    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    // Ensure this won't get stripped by the Swift compiler
    _ = ExpoModulesProvider()
  }

  /**
   * Creates the React Native view using RCTReactNativeFactory
   */
  public func loadView(
    moduleName: String,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) throws -> UIView {
    cleanupPreviousInstance()

    let delegate = ReactNativeDelegate()
    delegate.dependencyProvider = RCTAppDependencyProvider()
    reactNativeFactory = ExpoReactNativeFactory(delegate: delegate)
    reactNativeDelegate = delegate

    guard let reactNativeFactory else {
      fatalError("Trying to load view without initializing reactNativeFactory")
    }

    // Needed to set up delegates (e.g. for expo-dev-menu)
    if firstViewLoad {
      firstViewLoad = false
      reactNativeFactory.startReactNative(
        withModuleName: moduleName,
        in: nil,
        launchOptions: nil
      )

      // No-op in release and without dev menu available
      ManifestProvider.setupDevMenuManifest(bundleURL: reactNativeDelegate?.bundleURL())
    }

    return reactNativeFactory.rootViewFactory.view(
      withModuleName: moduleName,
      initialProperties: initialProps,
      launchOptions: launchOptions
    )
  }

  /**
   * Cleans up the previous instance of React Native
   * to prevent memory leaks
   */
  public func cleanupPreviousInstance() {
    if let rootViewFactory = reactNativeFactory?.rootViewFactory {
      rootViewFactory.setValue(nil, forKey: "_reactHost")
      reactNativeDelegate = nil
      reactNativeFactory = nil
    }
  }
}
