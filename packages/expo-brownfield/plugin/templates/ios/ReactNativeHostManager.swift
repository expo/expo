internal import Expo
import Network
internal import React
internal import ReactAppDependencyProvider
import UIKit

public class ReactNativeHostManager {
  public static let shared = ReactNativeHostManager()

  private var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  private var reactNativeFactory: RCTReactNativeFactory?

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

    return reactNativeFactory.rootViewFactory.view(
      withModuleName: moduleName,
      initialProperties: initialProps,
      launchOptions: launchOptions
    )
  }
}
