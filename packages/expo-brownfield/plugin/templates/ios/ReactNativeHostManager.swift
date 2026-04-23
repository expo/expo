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
  private var firstLoadInitialized: Bool = false
  private var devMenuInitialized: Bool = false
  private var turboModuleClasses: [String: AnyClass] = [:]

  /**
   * Initializes ReactNativeHostManager instance
   * Instance can be initialized only once
   */
  public func initialize(turboModuleClasses: [String: AnyClass] = [:]) {
    if firstLoadInitialized {
      return
    }

    self.turboModuleClasses = turboModuleClasses
    firstLoadInitialized = true
    initializeInstance()
    // Ensure this won't get stripped by the Swift compiler
    _ = ExpoModulesProvider()
  }

  /**
   * Creates the React Native view using RCTReactNativeFactory
   */
  public func loadView(
    moduleName: String = "main",
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) throws -> UIView {
    guard firstLoadInitialized, let reactNativeFactory else {
      fatalError(
        "loadView called before initialize(). Call ReactNativeHostManager.shared.initialize() first."
      )
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
    let delegate = ReactNativeDelegate(turboModuleClasses: turboModuleClasses)
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
    devMenuInitialized = false
  }

  /**
   * Starts React Native (which initializes delegates) and
   * fetches and updates the manifest for dev menu if dev menu is
   * available. Runs at most once per factory — calling startReactNative
   * multiple times on the same factory would duplicate delegate setup.
   */
  private func setupDevMenu() {
    #if DEBUG && canImport(EXDevMenu)
    if devMenuInitialized {
      return
    }

    guard let reactNativeFactory else {
      fatalError("Trying to setup dev menu without initialized reactNativeFactory")
    }

    devMenuInitialized = true

    // Needed to set up delegates (e.g. for expo-dev-menu)
    reactNativeFactory.startReactNative(
      withModuleName: "main",
      in: nil,
      launchOptions: nil
    )

    ManifestProvider.fetchManifest(bundleURL: reactNativeDelegate?.bundleURL()) { json, url in
      if let json, let url {
        let manifest = ManifestFactory.manifest(forManifestJSON: json)
        DevMenuManager.shared.updateCurrentManifest(manifest, manifestURL: url)
      }
    }
    #endif
  }
}
