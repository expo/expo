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

  /// Legacy `disableOnboarding=1` on any URL, including the app URL inside the encoded `url` value.
  @objc
  public static func disableOnboardingPopupIfNeeded(_ url: URL) {
    let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
    if items.contains(where: { $0.name == "disableOnboarding" && $0.value == "1" }) {
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
}
