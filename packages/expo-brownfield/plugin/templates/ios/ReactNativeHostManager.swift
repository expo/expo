@_implementationOnly import Expo
import Network
@_implementationOnly import React
@_implementationOnly import ReactAppDependencyProvider
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
    }

    return reactNativeFactory.rootViewFactory.view(
      withModuleName: moduleName,
      initialProperties: initialProps,
      launchOptions: launchOptions
    )
  }
}
