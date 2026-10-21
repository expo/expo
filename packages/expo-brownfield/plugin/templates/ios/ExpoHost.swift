import Combine
internal import Expo
internal import ExpoBrownfield
internal import EXManifests
internal import React
internal import ReactAppDependencyProvider
import UIKit

#if DEBUG && canImport(EXDevMenu)
internal import EXDevMenu
#endif

/// Own one host for all Expo scenes that share a JavaScript bundle.
@MainActor
public final class ExpoHost: ObservableObject {
  public enum BundleSource {
    case embedded
    #if DEBUG
    case developmentServer
    #endif
  }

  private let bundleSource: BundleSource
  private let turboModuleClasses: [String: AnyClass]
  private var delegate: ReactNativeDelegate?
  private var factory: ExpoReactNativeFactory?

  public init(
    bundleSource: BundleSource = .embedded,
    turboModuleClasses: [String: AnyClass] = [:]
  ) {
    self.bundleSource = bundleSource
    self.turboModuleClasses = turboModuleClasses
  }

  func loadView(
    name: String,
    props: [AnyHashable: Any],
    launchOptions: [AnyHashable: Any]? = nil
  ) throws -> UIView {
    let factory = try getFactory()
    return factory.rootViewFactory.view(
      withModuleName: name,
      initialProperties: props,
      launchOptions: launchOptions,
      bundleConfiguration: factory.bundleConfiguration,
      devMenuConfiguration: factory.devMenuConfiguration ?? RCTDevMenuConfiguration.default()
    )
  }

  func reset() {
    // RCTHost's C++ declarations hide the public reactHost property from Swift.
    factory?.rootViewFactory.setValue(nil, forKey: "reactHost")
    factory = nil
    delegate = nil
  }

  private func getFactory() throws -> ExpoReactNativeFactory {
    if let factory {
      return factory
    }

    let bundleURL: URL
    switch bundleSource {
    case .embedded:
      let bundle = Bundle(for: ReactNativeHostManager.self)
      guard let url = bundle.url(forResource: "main", withExtension: "jsbundle") else {
        throw HostError.missingBundle(bundle.bundlePath)
      }
      bundleURL = url
    #if DEBUG
    case .developmentServer:
      guard let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(
        forBundleRoot: ".expo/.virtual-metro-entry"
      ) else {
        throw HostError.missingDevelopmentServer
      }
      bundleURL = url
    #endif
    }

    let delegate = ReactNativeDelegate(turboModuleClasses: turboModuleClasses, bundleURL: bundleURL)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    self.delegate = delegate
    self.factory = factory
    _ = ExpoModulesProvider()

    #if DEBUG && canImport(EXDevMenu)
    if !bundleURL.isFileURL {
      ManifestProvider.fetchManifest(bundleURL: bundleURL) { json, url in
        if let json, let url {
          let manifest = ManifestFactory.manifest(forManifestJSON: json)
          DevMenuManager.shared.updateCurrentManifest(manifest, manifestURL: url)
        }
      }
    }
    #endif

    return factory
  }

  private enum HostError: LocalizedError {
    case missingBundle(String)
    case missingDevelopmentServer

    var errorDescription: String? {
      switch self {
      case .missingBundle(let path):
        return "Expo could not load main.jsbundle from \(path). Rebuild the brownfield framework with embedded bundling enabled."
      case .missingDevelopmentServer:
        return "Expo could not resolve the development server. Run npx expo start or use ExpoHost(bundleSource: .embedded)."
      }
    }
  }
}
