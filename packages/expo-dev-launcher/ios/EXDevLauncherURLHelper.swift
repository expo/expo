// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXDevMenu

@objc
public class EXDevLauncherUrl: NSObject {
  @objc
  public var url: URL

  @objc
  public var queryParams: [String: String]

  @objc
  public init(_ url: URL) {
    let launch = ExpoLauncherURL(url)
    self.queryParams = launch.passthroughParams
    self.url = EXDevLauncherURLHelper.replaceEXPScheme(launch.targetURL ?? launch.strippedURL, to: "http")

    super.init()
  }
}

@objc
public class EXDevLauncherURLHelper: NSObject {
  @objc
  public static func isDevLauncherURL(_ url: URL?) -> Bool {
    guard let url else {
      return false
    }
    return ExpoLauncherURL(url).isLauncherCommand
  }

  /// Whether the launcher URL names a project to load, through `__expo_url` or the legacy `url`.
  @objc
  public static func hasUrlQueryParam(_ url: URL) -> Bool {
    return ExpoLauncherURL(url).targetURL != nil
  }

  /// Whether the URL uses the legacy `expo-development-client` host.
  @objc
  public static func isLegacyLauncherURL(_ url: URL) -> Bool {
    return ExpoLauncherURL(url).isLegacyHost
  }

  /// For a launcher command without a target, e.g. `myapp://login?__expo_disable_fab=1`, the deep
  /// link the app receives once the launcher consumed the reserved params. `nil` when the remainder
  /// has no destination of its own.
  @objc
  public static func externalDeepLink(fromLauncherURL url: URL) -> URL? {
    let launch = ExpoLauncherURL(url)
    guard launch.isLauncherCommand, !launch.isLegacyHost, launch.targetURL == nil, launch.remainderHasDestination else {
      return nil
    }
    return launch.strippedURL
  }

  static func hasEnabledFlag(_ name: String, in url: URL) -> Bool {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    let queryItems = components.queryItems else {
      return false
    }

    return queryItems.contains { $0.name == name && ($0.value ?? "") == "1" }
  }

  @objc
  public static func disableOnboardingPopupIfNeeded(_ url: URL) {
    if hasEnabledFlag("disableOnboarding", in: url) {
      DevMenuPreferences.isOnboardingFinished = true
    }
  }

  /// The `disableFab=1` and `disableAutoLaunch=1` params update the saved dev menu preferences.
  @objc
  public static func applyDevMenuPreferencesIfNeeded(_ url: URL) {
    if hasEnabledFlag("disableFab", in: url) {
      DevMenuManager.shared.setShowFloatingActionButton(false)
    }

    if hasEnabledFlag("disableAutoLaunch", in: url) {
      DevMenuPreferences.isOnboardingFinished = true
      DevMenuManager.shared.setShowsAtLaunch(false)
    }
  }

  @objc
  public static func replaceEXPScheme(_ url: URL, to scheme: String) -> URL {
    guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    components.scheme == "exp" else {
      return url
    }

    components.scheme = scheme
    return components.url ?? url
  }

  // Expo CLI's manifest endpoint only accepts `ios`/`android`/`web`, so on
  // platforms like `macos` we ask it for `ios` and rewrite the `platform`
  // query param on the bundle URL it returns to match the actual runtime.
  @objc
  public static func bundleURL(_ bundleURL: URL, withResolvedPlatform platform: String) -> URL {
    guard !bundleURL.isFileURL,
          var components = URLComponents(url: bundleURL, resolvingAgainstBaseURL: false),
          var queryItems = components.queryItems else {
      return bundleURL
    }
    var didReplace = false
    for i in queryItems.indices where queryItems[i].name == "platform" {
      queryItems[i] = URLQueryItem(name: "platform", value: platform)
      didReplace = true
    }
    guard didReplace else {
      return bundleURL
    }
    components.queryItems = queryItems
    return components.url ?? bundleURL
  }
}
