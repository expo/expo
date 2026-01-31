internal import Expo
import Network
internal import React
internal import ReactAppDependencyProvider
import UIKit

#if DEBUG && canImport(EXDevMenu) && canImport(EXManifests)
@_implementationOnly import EXDevMenu
@_implementationOnly import EXManifests
#endif

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

      #if DEBUG && canImport(EXDevMenu) && canImport(EXManifests)
      let bundleURL = reactNativeDelegate?.bundleURL()
      setupDevMenuManifest(bundleURL: bundleURL)
      #endif
    }

    return reactNativeFactory.rootViewFactory.view(
      withModuleName: moduleName,
      initialProperties: initialProps,
      launchOptions: launchOptions
    )
  }

  #if DEBUG && canImport(EXDevMenu) && canImport(EXManifests)
  private func setupDevMenuManifest(bundleURL: URL?) {
    guard let bundleURL else {
      print("⚠️ Bundle URL couldn't be retrieved")
      return
    }

    guard let scheme = bundleURL.scheme,
          let host = bundleURL.host,
          let port = bundleURL.port else {
      print("⚠️ Metro server URL couldn't be retrieved from bundle URL")
      return
    }

    guard let manifestURL = URL(string: "\(scheme)://\(host):\(port)") else {
      print("⚠️ Manifest URL couldn't be created")
      return
    }

    var request = URLRequest(url: manifestURL)
    request.setValue("ios", forHTTPHeaderField: "expo-platform")
    request.setValue("application/expo+json,application/json", forHTTPHeaderField: "accept")
    request.timeoutInterval = 10.0

    print("📡 Fetching manifest for dev-menu from: \(manifestURL.absoluteString)")
    let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      if let error = error {
        print("❌ Error fetching manifest: \(error.localizedDescription)")
        return
      }

      guard let data = data,
          let httpResponse = response as? HTTPURLResponse,
          (200..<300).contains(httpResponse.statusCode) else {
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        print("⚠️ Invalid response when fetching manifest (status: \(statusCode))")
        return
      }

      guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        print("⚠️ Could not parse manifest JSON")
        return
      }

      print("✅ Successfully fetched manifest")
      let manifest = ManifestFactory.manifest(forManifestJSON: json)
      DevMenuManager.shared.updateCurrentManifest(manifest, manifestURL: manifestURL)
    }
    
    task.resume()
  }
  #endif
}
