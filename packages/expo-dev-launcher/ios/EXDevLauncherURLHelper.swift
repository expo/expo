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
    let launch = ExpoLaunchURL(url)
    // Query params the launcher passes on, for example `updateMessage`. Never contains reserved params.
    self.queryParams = launch.passthroughParams
    // The project URL to load, with `exp` rewritten to `http`.
    self.url = EXDevLauncherURLHelper.replaceEXPScheme(launch.targetURL ?? launch.strippedURL, to: "http")

    super.init()
  }
}

@objc
public class EXDevLauncherURLHelper: NSObject {
  /// A launcher command: any `__expo_*` query param, or the legacy `expo-development-client` host.
  @objc
  public static func isDevLauncherURL(_ url: URL?) -> Bool {
    guard let url else {
      return false
    }
    return ExpoLaunchURL(url).isLauncherCommand
  }

  /// Whether the launcher URL names a project to load, through `__expo_url` or the legacy `url`.
  @objc
  public static func hasUrlQueryParam(_ url: URL) -> Bool {
    return ExpoLaunchURL(url).targetURL != nil
  }

  /// For a launcher command without a target, e.g. `myapp://login?__expo_launch_token=...`, the deep
  /// link the app receives once the launcher consumed the reserved params. `nil` when the remainder
  /// has no destination of its own.
  @objc
  public static func externalDeepLink(fromLauncherURL url: URL) -> URL? {
    let launch = ExpoLaunchURL(url)
    guard launch.isLauncherCommand, !launch.isLegacyHost, launch.targetURL == nil, launch.remainderHasDestination else {
      return nil
    }
    return launch.strippedURL
  }

  @objc
  public static func disableOnboardingPopupIfNeeded(_ url: URL) {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    let queryItems = components.queryItems else {
      return
    }

    let shouldDisable = queryItems.contains {
      $0.name == "disableOnboarding" && ($0.value ?? "") == "1"
    }

    if shouldDisable {
      DevMenuPreferences.isOnboardingFinished = true
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

  @objc
  public static func getQueryParamsForUrl(_ url: URL) -> [String: String] {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    let queryItems = components.queryItems else {
      return [:]
    }

    var params: [String: String] = [:]
    for item in queryItems {
      params[item.name] = item.value?.removingPercentEncoding ?? ""
    }

    return params
  }
}
