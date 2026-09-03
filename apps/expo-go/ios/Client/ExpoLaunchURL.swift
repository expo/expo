// Copyright 2015-present 650 Industries. All rights reserved.

// ponytail: byte-identical copy of packages/expo-dev-menu/ios/Launch/ExpoLaunchURL.swift below this
// header. Expo Go's Podfile excludes expo-dev-menu. Ceiling: unfork the dev menu or move the parser
// to expo-modules-core, then delete this file.

import Foundation

/**
 Parses the reserved `__expo_*` query params of a launch URL.

 A URL is a launcher command when it carries any `__expo_*` param, or when its host is the legacy
 alias `expo-development-client`. The development client and Expo Go share this parser.
 Keep in sync with `packages/expo-dev-menu/android/src/main/java/expo/modules/devmenu/launch/ExpoLaunchUrl.kt`.
 */
public struct ExpoLaunchURL {
  /// Reserved query params start with this prefix.
  public static let reservedPrefix = "__expo_"
  public static let legacyHost = "expo-development-client"

  /// The reserved launcher params, keyed by the suffix that follows `reservedPrefix`.
  public enum Param: String {
    case url
    case launchToken = "launch_token"
    case disableOnboarding = "disable_onboarding"
    case disableFab = "disable_fab"
    case disableAutoLaunch = "disable_auto_launch"

    /// The full query param name, e.g. `__expo_launch_token`.
    public var name: String {
      return ExpoLaunchURL.reservedPrefix + rawValue
    }
  }

  private static let legacyUrlParam = "url"
  private static let legacyDisableOnboardingParam = "disableOnboarding"
  private static let legacyDisableFabParam = "disableFab"
  private static let legacyDisableAutoLaunchParam = "disableAutoLaunch"

  public let url: URL

  /// `true` when the host is the legacy `expo-development-client` alias.
  public let isLegacyHost: Bool

  /// `true` when the URL carries at least one `__expo_*` query param.
  public let hasReservedParams: Bool

  /// `true` when the launcher consumes this URL instead of passing it to the app.
  public var isLauncherCommand: Bool {
    return isLegacyHost || hasReservedParams
  }

  /// The project URL to load, from `__expo_url` or the legacy `url` param. `nil` when absent.
  public let targetURL: URL?

  /// Single-use token minted by Expo Orbit. Never persist or log it.
  public let launchToken: String?

  /// `__expo_disable_onboarding=1`, or the legacy `disableOnboarding=1` on the legacy host.
  public let disablesOnboarding: Bool

  /// `__expo_disable_fab=1`, or the legacy `disableFab=1` on the legacy host: hide the floating tools button.
  public let disablesFab: Bool

  /// `__expo_disable_auto_launch=1`, or the legacy `disableAutoLaunch=1` on the legacy host: do not open the dev menu at launch.
  public let disablesAutoLaunch: Bool

  /// The URL without its `__expo_*` params. The legacy `url=` form is kept as is.
  public let strippedURL: URL

  /// Query params that are not reserved, percent-decoded once.
  public let passthroughParams: [String: String]

  /// `true` when `strippedURL` still names a destination an app can route: a host or a path.
  public let remainderHasDestination: Bool

  public init(_ url: URL) {
    let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
    func value(named name: String) -> String? {
      return items.first { $0.name == name }?.value
    }
    func value(_ param: Param) -> String? {
      return value(named: param.name)
    }

    let isLegacyHost = url.host == Self.legacyHost
    let hasReservedParams = items.contains { $0.name.hasPrefix(Self.reservedPrefix) }
    let target = value(.url) ?? (isLegacyHost ? value(named: Self.legacyUrlParam) : nil)
    let strippedURL = hasReservedParams ? Self.strippingReservedParams(from: url) : url
    let host = strippedURL.host ?? ""
    let path = strippedURL.path

    var passthrough: [String: String] = [:]
    for item in items where !item.name.hasPrefix(Self.reservedPrefix) {
      passthrough[item.name] = item.value ?? ""
    }

    self.url = url
    self.isLegacyHost = isLegacyHost
    self.hasReservedParams = hasReservedParams
    self.targetURL = target.flatMap { $0.isEmpty ? nil : URL(string: $0) }
    self.launchToken = value(.launchToken).flatMap { $0.isEmpty ? nil : $0 }
    self.disablesOnboarding = value(.disableOnboarding) == "1"
      || (isLegacyHost && value(named: Self.legacyDisableOnboardingParam) == "1")
    self.disablesFab = value(.disableFab) == "1"
      || (isLegacyHost && value(named: Self.legacyDisableFabParam) == "1")
    self.disablesAutoLaunch = value(.disableAutoLaunch) == "1"
      || (isLegacyHost && value(named: Self.legacyDisableAutoLaunchParam) == "1")
    self.strippedURL = strippedURL
    self.passthroughParams = passthrough
    self.remainderHasDestination = (!host.isEmpty && host != Self.legacyHost) || (!path.isEmpty && path != "/")
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
