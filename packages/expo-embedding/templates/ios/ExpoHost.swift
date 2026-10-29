import Combine
internal import Expo
internal import React
internal import ReactAppDependencyProvider
import UIKit


/// Own one host for all Expo scenes that share a JavaScript bundle.
@MainActor
public final class ExpoHost: ObservableObject {
  public enum BundleSource {
    case automatic
    case embedded
    #if DEBUG
    case developmentServer
    #endif
  }

  private let bundleSource: BundleSource
  private let turboModuleClasses: [String: AnyClass]
  private var delegate: ReactNativeDelegate?
  private var factory: ExpoReactNativeFactory?
  private var factoryTask: Task<Void, Error>?

  public init(
    bundleSource: BundleSource = .automatic,
    turboModuleClasses: [String: AnyClass] = [:]
  ) {
    self.bundleSource = bundleSource
    self.turboModuleClasses = turboModuleClasses
  }

  func loadView(
    name: String,
    props: [AnyHashable: Any],
    launchOptions: [AnyHashable: Any]? = nil
  ) async throws -> UIView {
    if factoryTask == nil {
      factoryTask = Task { try await self.makeFactory() }
    }
    try await factoryTask!.value
    guard let factory else { throw CancellationError() }
    #if DEBUG
    return factory.rootViewFactory.view(
      withModuleName: name,
      initialProperties: props,
      launchOptions: launchOptions,
      bundleConfiguration: factory.bundleConfiguration,
      devMenuConfiguration: factory.devMenuConfiguration ?? RCTDevMenuConfiguration.default()
    )
    #else
    // React Native's Release runtime returns nil for the default dev-menu configuration.
    return factory.rootViewFactory.view(
      withModuleName: name,
      initialProperties: props,
      launchOptions: launchOptions
    )
    #endif
  }

  func reset() {
    factoryTask?.cancel()
    factoryTask = nil
    // RCTHost's C++ declarations hide the public reactHost property from Swift.
    factory?.rootViewFactory.setValue(nil, forKey: "reactHost")
    factory = nil
    delegate = nil
  }

  private func resolveBundleURL() async throws -> URL {
    let bundle = Bundle(for: ExpoHost.self)
    #if DEBUG
    if bundleSource != .embedded {
      let provider = RCTBundleURLProvider.sharedSettings()
      let deviceHost = bundle.url(forResource: "ip", withExtension: "txt")
        .flatMap { try? String(contentsOf: $0, encoding: .utf8).trimmingCharacters(in: .whitespacesAndNewlines) }
      let location = provider.jsLocation ?? deviceHost ?? "localhost"
      if var server = URLComponents(string: "\(provider.packagerScheme)://\(location)") {
        if server.port == nil {
          server.port = (Bundle.main.object(forInfoDictionaryKey: "RCTMetroPort") as? Int) ?? 8081
        }
        if let url = server.url,
           let projectFile = bundle.url(forResource: "expo-project-root", withExtension: "txt"),
           let projectRoot = try? String(contentsOf: projectFile, encoding: .utf8).trimmingCharacters(in: .newlines),
           await ExpoBundleResolver.isMatchingMetro(url, projectRoot: projectRoot) {
          server.path = "/.expo/.virtual-metro-entry.bundle"
          server.queryItems = [
            URLQueryItem(name: "platform", value: "ios"),
            URLQueryItem(name: "dev", value: "true"),
            URLQueryItem(name: "minify", value: "false")
          ]
          if let bundleURL = server.url { return bundleURL }
        }
      }
      if bundleSource == .developmentServer { throw HostError.missingDevelopmentServer }
    }
    #endif
    guard let url = bundle.url(forResource: "main", withExtension: "jsbundle") else {
      throw HostError.missingBundle(bundle.bundlePath)
    }
    return url
  }

  private func makeFactory() async throws {
    let bundleURL = try await resolveBundleURL()
    try Task.checkCancellation()
    let delegate = ReactNativeDelegate(turboModuleClasses: turboModuleClasses, bundleURL: bundleURL)
    delegate.dependencyProvider = RCTAppDependencyProvider()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    self.delegate = delegate
    self.factory = factory
    _ = ExpoModulesProvider()


  }

  private enum HostError: LocalizedError {
    case missingBundle(String)
    case missingDevelopmentServer

    var errorDescription: String? {
      switch self {
      case .missingBundle(let path):
        return "Expo could not load main.jsbundle from \(path). Rebuild the brownfield framework with embedded bundling enabled."
      case .missingDevelopmentServer:
        return "Expo could not reach this project's Metro server within one second. Run npx expo start in expo/, check device connectivity, or use ExpoHost(bundleSource: .automatic) for embedded fallback."
      }
    }
  }
}
