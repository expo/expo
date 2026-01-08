internal import Expo
import Network
internal import React
internal import ReactAppDependencyProvider
import UIKit

public class ReactNativeHostManager {
  public static let shared = ReactNativeHostManager()

  private var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  private var reactNativeFactory: RCTReactNativeFactory?
  public private(set) var expoDelegateWrapper: ExpoAppDelegateWrapper?

  /// Initializes the React Native host manager shared instance.
  /// Prevents multiple initializations of the React Native host manager shared instance.
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

    expoDelegateWrapper = ExpoAppDelegateWrapper(factory: factory)

    // Ensure this won't get stripped by the Swift compiler
    _ = ExpoModulesProvider()
  }

  /// Loads and presents the React Native view.
  public func loadView(
    moduleName: String,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) throws -> UIView {
    guard let expoDelegateWrapper else {
      fatalError("Trying to load view without ExpoAppDelegateWrapper initialized")
    }

    return expoDelegateWrapper.recreateRootView(
      withBundleURL: nil,
      moduleName: moduleName,
      initialProps: initialProps,
      launchOptions: launchOptions
    )
  }
}
