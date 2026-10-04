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
  public let isLegacyHost: Bool
  public let isLauncherCommand: Bool
  /// From `__expo_url`, or the legacy `url` next to the legacy host.
  public let targetURL: URL?
  /// `__expo_disable_onboarding=1`, or the legacy `disableOnboarding=1` next to the legacy host.
  public let disablesOnboarding: Bool
  /// `__expo_disable_fab=1`: hide the floating tools button for this process.
  public let disablesFab: Bool
  /// `__expo_disable_auto_launch=1`: do not open the dev menu at launch in this process.
  public let disablesAutoLaunch: Bool
  /// The URL without its `__expo_*` params.
  public let strippedURL: URL
  /// The other query params, percent-decoded.
  public let passthroughParams: [String: String]
  /// Whether `strippedURL` still points somewhere an app can route: a host or a path.
  public let remainderHasDestination: Bool

  public init(_ url: URL) {
    let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
    let isLegacyHost = url.host == Self.legacyHost
    let isReserved = { (item: URLQueryItem) in item.name.hasPrefix(Self.reservedPrefix) }
    // `__expo_<name>`, or the legacy param next to the legacy host.
    func param(_ name: String, legacy: String? = nil) -> String? {
      if let value = items.first(where: { $0.name == Self.reservedPrefix + name })?.value {
        return value
      }
      guard isLegacyHost, let legacy else {
        return nil
      }
      return items.first(where: { $0.name == legacy })?.value
    }
    let strippedURL = items.contains(where: isReserved) ? Self.strippingReservedParams(from: url) : url
    let host = strippedURL.host ?? ""

    self.url = url
    self.isLegacyHost = isLegacyHost
    self.isLauncherCommand = isLegacyHost || items.contains(where: isReserved)
    self.targetURL = param("url", legacy: "url").flatMap { $0.isEmpty ? nil : URL(string: $0) }
    self.disablesOnboarding = param("disable_onboarding", legacy: "disableOnboarding") == "1"
    self.disablesFab = param("disable_fab") == "1"
    self.disablesAutoLaunch = param("disable_auto_launch") == "1"
    self.strippedURL = strippedURL
    self.passthroughParams = items.filter { !isReserved($0) }.reduce(into: [:]) { $0[$1.name] = $1.value ?? "" }
    self.remainderHasDestination = (!host.isEmpty && host != Self.legacyHost)
      || (!strippedURL.path.isEmpty && strippedURL.path != "/")
  }

  private static func strippingReservedParams(from url: URL) -> URL {
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
      let items = components.percentEncodedQueryItems else {
      return url
    }
    let remaining = items.filter { !($0.name.removingPercentEncoding ?? $0.name).hasPrefix(reservedPrefix) }
    components.percentEncodedQueryItems = remaining.isEmpty ? nil : remaining
    return components.url ?? url
  }
}
