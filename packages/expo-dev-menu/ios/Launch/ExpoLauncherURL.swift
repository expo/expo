// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 Parses the reserved `__expo_*` query params of a launch URL. A URL is a launcher command when it
 carries any `__expo_*` param or its host is the legacy `expo-development-client`.
 Keep in sync with `packages/expo-dev-menu/android/src/debug/java/expo/modules/devmenu/launch/ExpoLauncherUrl.kt`.
 */
public struct ExpoLauncherURL {
  public static let reservedPrefix = "__expo_"
  public static let legacyHost = "expo-development-client"

  public let url: URL
  private let items: [URLQueryItem]

  public init(_ url: URL) {
    self.url = url
    self.items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
  }

  public var isLegacyHost: Bool { url.host == Self.legacyHost }
  public var isLauncherCommand: Bool { isLegacyHost || hasReservedParams }

  /// From `__expo_url`, or the legacy `url` next to the legacy host.
  public var targetURL: URL? { param("url", legacy: "url").flatMap { $0.isEmpty ? nil : URL(string: $0) } }
  public var disablesOnboarding: Bool { param("disable_onboarding", legacy: "disableOnboarding") == "1" }
  public var disablesFab: Bool { param("disable_fab", legacy: "disableFab") == "1" }
  public var disablesAutoLaunch: Bool { param("disable_auto_launch", legacy: "disableAutoLaunch") == "1" }

  /// The URL without its `__expo_*` params.
  public var strippedURL: URL {
    guard hasReservedParams,
      var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
      let encoded = components.percentEncodedQueryItems else {
      return url
    }
    let remaining = encoded.filter { !($0.name.removingPercentEncoding ?? $0.name).hasPrefix(Self.reservedPrefix) }
    components.percentEncodedQueryItems = remaining.isEmpty ? nil : remaining
    return components.url ?? url
  }

  /// The other query params, percent-decoded.
  public var passthroughParams: [String: String] {
    items.filter { !isReserved($0) }.reduce(into: [:]) { $0[$1.name] = $1.value ?? "" }
  }

  /// Whether `strippedURL` still points somewhere an app can route: a host or a path.
  public var remainderHasDestination: Bool {
    let stripped = strippedURL
    let host = stripped.host ?? ""
    return (!host.isEmpty && host != Self.legacyHost) || (!stripped.path.isEmpty && stripped.path != "/")
  }

  private var hasReservedParams: Bool { items.contains(where: isReserved) }

  private func isReserved(_ item: URLQueryItem) -> Bool { item.name.hasPrefix(Self.reservedPrefix) }

  /// `__expo_<name>`, or the `legacy` param next to the legacy host.
  private func param(_ name: String, legacy: String) -> String? {
    items.first { $0.name == Self.reservedPrefix + name }?.value
      ?? (isLegacyHost ? items.first { $0.name == legacy }?.value : nil)
  }
}
