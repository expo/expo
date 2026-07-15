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
    self.queryParams = EXDevLauncherURLHelper.getQueryParamsForUrl(url)

    if EXDevLauncherURLHelper.isDevLauncherURL(url),
      let urlParam = queryParams["url"],
      let urlFromParam = URL(string: urlParam) {
      self.url = EXDevLauncherURLHelper.replaceEXPScheme(
        urlFromParam,
        to: EXDevLauncherURLHelper.packagerScheme(for: urlFromParam)
      )
    } else {
      self.url = EXDevLauncherURLHelper.replaceEXPScheme(
        url,
        to: EXDevLauncherURLHelper.packagerScheme(for: url)
      )
    }

    super.init()
  }
}

@objc
public class EXDevLauncherURLHelper: NSObject {
  @objc
  public static func isDevLauncherURL(_ url: URL?) -> Bool {
    return url?.host == "expo-development-client"
  }

  @objc
  public static func hasUrlQueryParam(_ url: URL) -> Bool {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
    let queryItems = components.queryItems else {
      return false
    }

    return queryItems.contains { $0.name == "url" && $0.value != nil }
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

  // Tunnel hosts (e.g. `*.exp.direct`) are served over TLS, and iOS App Transport
  // Security blocks cleartext HTTP to remote hosts. Map `exp://` tunnel URLs to
  // `https` — matching the scheme the Expo CLI already uses for tunnel manifest
  // URLs (`UrlCreator.constructDevClientUrl`) — while LAN/localhost dev servers
  // keep using `http`.
  @objc
  public static func packagerScheme(for url: URL) -> String {
    if url.host?.hasSuffix(".exp.direct") == true {
      return "https"
    }
    return "http"
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
