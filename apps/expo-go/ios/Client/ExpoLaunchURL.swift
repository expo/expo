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
  public static let reservedPrefix = "__expo_"
  public static let legacyHost = "expo-development-client"
  public static let urlParam = "__expo_url"
  public static let launchTokenParam = "__expo_launch_token"
  public static let disableOnboardingParam = "__expo_disable_onboarding"
  public static let showMenuAtLaunchParam = "__expo_show_menu_at_launch"
  public static let toolsButtonParam = "__expo_tools_button"
  private static let legacyUrlParam = "url"
  private static let legacyDisableOnboardingParam = "disableOnboarding"

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

  /// `__expo_show_menu_at_launch=0`: do not open the dev menu automatically in this process.
  public let suppressesMenuAtLaunch: Bool

  /// `__expo_tools_button=0`: hide the floating tools button in this process.
  public let hidesToolsButton: Bool

  /// The URL without its `__expo_*` params. The legacy `url=` form is kept as is.
  public let strippedURL: URL

  /// Query params that are not reserved, percent-decoded once.
  public let passthroughParams: [String: String]

  /// `true` when `strippedURL` still names a destination an app can route: a host or a path.
  public let remainderHasDestination: Bool

  public init(_ url: URL) {
    let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
    func value(_ name: String) -> String? {
      return items.first { $0.name == name }?.value
    }

    let isLegacyHost = url.host == Self.legacyHost
    let hasReservedParams = items.contains { $0.name.hasPrefix(Self.reservedPrefix) }
    let target = value(Self.urlParam) ?? (isLegacyHost ? value(Self.legacyUrlParam) : nil)
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
    self.launchToken = value(Self.launchTokenParam).flatMap { $0.isEmpty ? nil : $0 }
    self.disablesOnboarding = value(Self.disableOnboardingParam) == "1"
      || (isLegacyHost && value(Self.legacyDisableOnboardingParam) == "1")
    self.suppressesMenuAtLaunch = value(Self.showMenuAtLaunchParam) == "0"
    self.hidesToolsButton = value(Self.toolsButtonParam) == "0"
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
