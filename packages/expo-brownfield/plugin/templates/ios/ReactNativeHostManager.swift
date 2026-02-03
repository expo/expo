internal import Expo
internal import ExpoBrownfield
internal import EXManifests
import Network
internal import React
internal import ReactAppDependencyProvider
import UIKit

#if DEBUG && canImport(EXDevMenu)
internal import EXDevMenu
#endif

public class ReactNativeHostManager {
  public static let shared = ReactNativeHostManager()

  private var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  private var reactNativeFactory: RCTReactNativeFactory?

  /**
   * Initializes ReactNativeHostManager instance
   * Instance can be initialized only once
   */
  public func initialize() {
    initializeInstance()
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
    initializeInstance()

    guard let reactNativeFactory else {
      fatalError("Trying to load view without initializing reactNativeFactory")
    }

    setupDevMenu()

    return reactNativeFactory.rootViewFactory.view(
      withModuleName: moduleName,
      initialProperties: initialProps,
      launchOptions: launchOptions
    )
  }

 /**
  * Initializes a React Native instance
  */
  public func initializeInstance() {
    let delegate = ReactNativeDelegate()
    reactNativeFactory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    reactNativeDelegate = delegate
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

  private func setupDevMenu() {
    guard let reactNativeFactory else {
      fatalError("Trying to setup dev menu without initialized reactNativeFactory")
    }

    // Needed to set up delegates (e.g. for expo-dev-menu)
    reactNativeFactory.startReactNative(
      withModuleName: "main", // TOOD(pmleczek): Unhardcode module name
      in: nil,
      launchOptions: nil
    )

    #if DEBUG && canImport(EXDevMenu)
    ManifestProvider.fetchManifest(bundleURL: reactNativeDelegate?.bundleURL()) { json, url in
      if let json, let url {
        let manifest = ManifestFactory.manifest(forManifestJSON: json)
        DevMenuManager.shared.updateCurrentManifest(manifest, manifestURL: url)
      }
    }
    #endif
  }
}
